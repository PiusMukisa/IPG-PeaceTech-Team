import express from 'express';
import session from 'express-session';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createContent,
  createContributor,
  createEvent,
  createImpactRecord,
  createPage,
  createPost,
  createProject,
  createTestimonial,
  deleteContent,
  deleteProject,
  findAdminByEmail,
  getDashboardSummary,
  getProjectById,
  getUserPermissions,
  hashPassword,
  initDb,
  listContent,
  listContributors,
  listEvents,
  listImpactRecords,
  listPages,
  listPosts,
  listProjects,
  listTestimonials,
  saveVerificationCode,
  updateContent,
  updateProject,
  verifyCode,
  verifyPassword,
} from './db.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const ADMIN_DIR = path.join(ROOT_DIR, 'admin');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ipg-super-secret-admin',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

function requireAdmin(req, res, next) {
  if (req.session?.admin) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized admin session.' });
}

function requirePermission(permission) {
  return (req, res, next) => {
    const permissions = req.session?.permissions || [];

    if (!req.session?.admin || !permissions.includes(permission)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }

    return next();
  };
}

async function sendLoginCode(email, code) {
  const hasPlaceholderPassword = String(process.env.SMTP_PASS || '').toLowerCase().includes('your-') || String(process.env.SMTP_PASS || '').toLowerCase().includes('replace');
  const mailEnabled = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && !hasPlaceholderPassword);

  if (!mailEnabled) {
    console.log(`[DEV MODE] Admin code for ${email}: ${code}`);
    return { devMode: true, code };
  }

  try {
    const message = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'IPG Admin login verification code',
      text: `Your secure IPG admin verification code is: ${code}. This code expires in 10 minutes.`,
    });

    return { devMode: false, messageId: message.messageId };
  } catch (error) {
    console.error('Email delivery failed. Falling back to dev code output.', error);
    console.log(`[DEV MODE] Admin code for ${email}: ${code}`);
    return { devMode: true, code };
  }
}

app.get('/', (req, res) => {
  res.json({
    message: 'IPG backend is running.',
    adminLogin: '/admin/login',
    docs: 'Use the admin login route to access the protected dashboard.',
  });
});

const adminRouter = express.Router();

adminRouter.get('/login', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(ADMIN_DIR, 'login.html'));
});

adminRouter.get('/dashboard', requireAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(ADMIN_DIR, 'dashboard.html'));
});

adminRouter.get('/dashboard.html', requireAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(ADMIN_DIR, 'dashboard.html'));
});

adminRouter.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

adminRouter.use(requireAdmin, express.static(ADMIN_DIR));
app.use('/admin', adminRouter);

app.post('/api/auth/login', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !email.includes('@') || !password) {
    return res.status(400).json({ error: 'Work email and password are required.' });
  }

  const admin = await findAdminByEmail(email);

  if (!admin) {
    return res.status(403).json({ error: 'Admin access is restricted to approved email addresses.' });
  }

  const isValidPassword = admin.password_hash ? verifyPassword(password, admin.password_hash) : password === (process.env.ADMIN_PASSWORD || 'IPGAdmin2026!');

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const result = await saveVerificationCode(email, code);
  const sendResult = await sendLoginCode(email, code);

  return res.json({
    success: true,
    message: 'Verification code sent to your email.',
    expiresAt: result.expiresAt,
    devCode: sendResult.devMode ? code : undefined,
  });
});

app.post('/api/auth/request-code', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const email = String(req.body?.email || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid admin email is required.' });
  }

  const admin = await findAdminByEmail(email);

  if (!admin) {
    return res.status(403).json({ error: 'Admin access is restricted to approved email addresses.' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const result = await saveVerificationCode(email, code);
  const sendResult = await sendLoginCode(email, code);

  return res.json({
    success: true,
    message: 'Verification code sent to your email.',
    expiresAt: result.expiresAt,
    devCode: sendResult.devMode ? code : undefined,
  });
});

app.post('/api/auth/verify-code', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const admin = await findAdminByEmail(email);

  if (!admin) {
    return res.status(403).json({ error: 'This account is not authorized for admin access.' });
  }

  const valid = await verifyCode(email, code);

  if (!valid) {
    return res.status(401).json({ error: 'The verification code is invalid or expired.' });
  }

  const permissions = await getUserPermissions(email);
  req.session.admin = {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
  };
  req.session.permissions = permissions;

  return res.json({
    success: true,
    message: 'Login confirmed.',
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
    },
    permissions,
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Admin session closed.' });
  });
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  res.json({
    loggedIn: true,
    admin: req.session.admin,
  });
});

app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const range = String(req.query.range || 'this_month');
  const [content, contributors, summary, projects, impact, events, pages, posts] = await Promise.all([
    listContent(),
    listContributors(),
    getDashboardSummary(range),
    listProjects(),
    listImpactRecords(),
    listEvents(),
    listPages(),
    listPosts(),
  ]);

  res.json({
    admin: req.session.admin,
    permissions: req.session.permissions,
    range,
    stats: {
      content: content.length,
      contributors: contributors.length,
      summary,
    },
    content,
    contributors,
    projects,
    impact,
    events,
    pages,
    posts,
  });
});

app.get('/api/dashboard/summary', requireAdmin, async (req, res) => {
  res.json(await getDashboardSummary(String(req.query.range || 'this_month')));
});

app.get('/api/projects', requireAdmin, async (req, res) => {
  const rows = await listProjects();
  res.json(rows);
});

app.get('/api/projects/:id', requireAdmin, async (req, res) => {
  const project = await getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  return res.json(project);
});

app.post('/api/projects', requireAdmin, requirePermission('projects.create'), async (req, res) => {
  try {
    const project = await createProject({
      ...req.body,
      createdBy: req.session.admin.id,
    });
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create project.' });
  }
});

app.patch('/api/projects/:id', requireAdmin, requirePermission('projects.edit'), async (req, res) => {
  try {
    const project = await updateProject(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    return res.json(project);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to update project.' });
  }
});

app.delete('/api/projects/:id', requireAdmin, requirePermission('projects.delete'), async (req, res) => {
  try {
    const project = await deleteProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    return res.json({ success: true, deleted: project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to delete project.' });
  }
});

app.get('/api/pages', requireAdmin, async (req, res) => {
  const rows = await listPages();
  res.json(rows);
});

app.get('/api/public-pages', requireAdmin, async (req, res) => {
  try {
    const pageFiles = fs
      .readdirSync(ROOT_DIR)
      .filter((name) => /\.(html)$/i.test(name) && !['admin', 'server'].includes(name))
      .sort();

    const pages = pageFiles.map((file) => {
      const slug = file.replace(/\.html$/i, '');
      const title = slug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      return {
        id: slug,
        slug,
        title: title === 'Index' ? 'Home' : title,
        path: slug === 'index' ? '/' : `/${slug}.html`,
      };
    });

    return res.json(pages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to list public pages.' });
  }
});

app.post('/api/pages', requireAdmin, requirePermission('pages.create'), async (req, res) => {
  try {
    const page = await createPage({
      ...req.body,
      createdBy: req.session.admin.id,
    });
    res.status(201).json(page);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create page.' });
  }
});

app.get('/api/posts', requireAdmin, async (req, res) => {
  const rows = await listPosts();
  res.json(rows);
});

app.post('/api/posts', requireAdmin, requirePermission('posts.create'), async (req, res) => {
  try {
    const post = await createPost({
      ...req.body,
      createdBy: req.session.admin.id,
    });
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create post.' });
  }
});

app.get('/api/testimonials', requireAdmin, async (req, res) => {
  const rows = await listTestimonials();
  res.json(rows);
});

app.post('/api/testimonials', requireAdmin, async (req, res) => {
  try {
    const item = await createTestimonial({
      ...req.body,
      createdBy: req.session.admin.id,
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create testimonial.' });
  }
});

app.get('/api/events', requireAdmin, async (req, res) => {
  const rows = await listEvents();
  res.json(rows);
});

app.post('/api/events', requireAdmin, requirePermission('events.create'), async (req, res) => {
  try {
    const item = await createEvent({
      ...req.body,
      createdBy: req.session.admin.id,
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create event.' });
  }
});

app.get('/api/impact', requireAdmin, async (req, res) => {
  const rows = await listImpactRecords();
  res.json(rows);
});

app.post('/api/impact', requireAdmin, requirePermission('impact.create'), async (req, res) => {
  try {
    const item = await createImpactRecord({
      ...req.body,
      createdBy: req.session.admin.id,
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to record impact.' });
  }
});

app.get('/api/content', requireAdmin, async (req, res) => {
  const rows = await listContent();
  res.json(rows);
});

app.post('/api/content', requireAdmin, async (req, res) => {
  try {
    const record = await createContent(req.body);
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create content.' });
  }
});

app.patch('/api/content/:id', requireAdmin, async (req, res) => {
  try {
    const record = await updateContent(req.params.id, req.body);
    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update content.' });
  }
});

app.delete('/api/content/:id', requireAdmin, async (req, res) => {
  try {
    const record = await deleteContent(req.params.id);
    res.json({ success: true, deleted: record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete content.' });
  }
});

app.get('/api/contributors', requireAdmin, async (req, res) => {
  const rows = await listContributors();
  res.json(rows);
});

app.post('/api/contributors', requireAdmin, async (req, res) => {
  try {
    const record = await createContributor(req.body);
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to add contributor.' });
  }
});

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`IPG admin backend running on http://localhost:${PORT}`);
      console.log(`Admin login: http://localhost:${PORT}/admin/login`);
    });
  } catch (error) {
    console.error('Failed to start backend.', error);
    process.exit(1);
  }
}

startServer();
