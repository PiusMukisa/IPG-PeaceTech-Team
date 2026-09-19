import express from 'express';
import session from 'express-session';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createContent,
  createContributor,
  deleteContent,
  findAdminByEmail,
  initDb,
  listContent,
  listContributors,
  saveVerificationCode,
  updateContent,
  verifyCode,
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
  res.sendFile(path.join(ADMIN_DIR, 'login.html'));
});

adminRouter.get('/dashboard', requireAdmin, (req, res) => {
  res.sendFile(path.join(ADMIN_DIR, 'dashboard.html'));
});

adminRouter.get('/dashboard.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(ADMIN_DIR, 'dashboard.html'));
});

adminRouter.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

adminRouter.use(requireAdmin, express.static(ADMIN_DIR));
app.use('/admin', adminRouter);

app.post('/api/auth/request-code', async (req, res) => {
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

  req.session.admin = {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
  };

  return res.json({
    success: true,
    message: 'Login confirmed.',
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Admin session closed.' });
  });
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.json({
    loggedIn: true,
    admin: req.session.admin,
  });
});

app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  const [content, contributors] = await Promise.all([
    listContent(),
    listContributors(),
  ]);

  res.json({
    admin: req.session.admin,
    stats: {
      content: content.length,
      contributors: contributors.length,
    },
    content,
    contributors,
  });
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
