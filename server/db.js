import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'node:crypto';
import path from 'node:path';

const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
];

envFiles.forEach((envFile) => {
  dotenv.config({ path: envFile });
});

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

export function getApprovedAdminEmails() {
  const configured = [
    process.env.ADMIN_EMAIL,
    process.env.APPROVED_ADMIN_EMAILS,
    process.env.ADMIN_EMAILS,
  ]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(configured)];
}

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Add it to a local .env file in the project root or server folder.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    process.env.DATABASE_SSL === 'true' || databaseUrl.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : false,
});

export async function ensureAdminTableColumns() {
  const existing = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'admins'`
  );
  const present = new Set(existing.rows.map((row) => row.column_name));

  if (!present.has('password_hash')) {
    await pool.query('ALTER TABLE admins ADD COLUMN password_hash VARCHAR(255);');
  }

  if (!present.has('updated_at')) {
    await pool.query('ALTER TABLE admins ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();');
  }

  await pool.query(`
    UPDATE admins
    SET updated_at = COALESCE(updated_at, created_at, NOW())
    WHERE updated_at IS NULL;
  `);
}

export async function initDb() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255),
        password_hash VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await ensureAdminTableColumns();

    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contributors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        email VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        body TEXT,
        category VARCHAR(120),
        status VARCHAR(50) DEFAULT 'draft',
        contributor_id INT REFERENCES contributors(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        label VARCHAR(150),
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        admin_id INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(admin_id, role_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        mission TEXT,
        featured_image TEXT,
        location VARCHAR(255),
        country VARCHAR(120),
        region VARCHAR(120),
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        project_manager VARCHAR(255),
        created_by INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        admin_id INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        role VARCHAR(100) DEFAULT 'member',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(project_id, admin_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        hero_heading VARCHAR(255),
        hero_description TEXT,
        content TEXT,
        featured_image TEXT,
        seo_title VARCHAR(255),
        seo_description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT,
        featured_image TEXT,
        project_id INT REFERENCES projects(id) ON DELETE SET NULL,
        category VARCHAR(120),
        location VARCHAR(255),
        author VARCHAR(255),
        publication_date TIMESTAMPTZ,
        seo_title VARCHAR(255),
        seo_description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role_description VARCHAR(255),
        location VARCHAR(255),
        testimonial TEXT NOT NULL,
        photo TEXT,
        project_id INT REFERENCES projects(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        event_date TIMESTAMPTZ,
        location VARCHAR(255),
        project_id INT REFERENCES projects(id) ON DELETE SET NULL,
        featured_image TEXT,
        registration_info TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        caption TEXT,
        description TEXT,
        project_id INT REFERENCES projects(id) ON DELETE SET NULL,
        uploaded_by INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS impact_records (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE SET NULL,
        country VARCHAR(120),
        region VARCHAR(120),
        district VARCHAR(160),
        community VARCHAR(160),
        activity_date DATE NOT NULL,
        activity_type VARCHAR(120),
        households_reached INT DEFAULT 0,
        people_reached INT DEFAULT 0,
        children_reached INT DEFAULT 0,
        adults_reached INT DEFAULT 0,
        women_reached INT DEFAULT 0,
        men_reached INT DEFAULT 0,
        communities_reached INT DEFAULT 0,
        description TEXT,
        outcome TEXT,
        notes TEXT,
        staff_responsible VARCHAR(255),
        created_by INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        resource VARCHAR(255),
        details TEXT,
        result VARCHAR(80) DEFAULT 'success',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_email
      ON verification_codes (email);
    `);

    await ensureDefaultRoles();
    await ensureDefaultPermissions();
    await assignDefaultPermissions();
    await ensureDefaultAdmin();
  } finally {
    client.release();
  }
}

export async function ensureDefaultRoles() {
  const roles = [
    ['super_administrator', 'Super Administrator', 'Full system access'],
    ['administrator', 'Administrator', 'Manage most organizational administration'],
    ['project_manager', 'Project Manager', 'Manage assigned projects'],
    ['content_editor', 'Content Editor', 'Manage website content'],
    ['impact_officer', 'Impact/Data Officer', 'Manage impact and reporting'],
    ['viewer', 'Viewer', 'Read-only access'],
  ];

  for (const [name, label, description] of roles) {
    await pool.query(
      `INSERT INTO roles (name, label, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO NOTHING`,
      [name, label, description]
    );
  }
}

export async function ensureDefaultPermissions() {
  const permissions = [
    ['users.view', 'View users'],
    ['users.create', 'Create users'],
    ['users.edit', 'Edit users'],
    ['users.delete', 'Delete users'],
    ['projects.view', 'View projects'],
    ['projects.create', 'Create projects'],
    ['projects.edit', 'Edit projects'],
    ['projects.delete', 'Delete projects'],
    ['pages.view', 'View pages'],
    ['pages.create', 'Create pages'],
    ['pages.edit', 'Edit pages'],
    ['pages.publish', 'Publish pages'],
    ['pages.delete', 'Delete pages'],
    ['posts.view', 'View posts'],
    ['posts.create', 'Create posts'],
    ['posts.edit', 'Edit posts'],
    ['posts.publish', 'Publish posts'],
    ['posts.delete', 'Delete posts'],
    ['events.create', 'Create events'],
    ['events.edit', 'Edit events'],
    ['events.publish', 'Publish events'],
    ['events.delete', 'Delete events'],
    ['media.view', 'View media'],
    ['media.upload', 'Upload media'],
    ['media.delete', 'Delete media'],
    ['impact.view', 'View impact data'],
    ['impact.create', 'Create impact data'],
    ['impact.edit', 'Edit impact data'],
    ['impact.delete', 'Delete impact data'],
    ['reports.view', 'View reports'],
    ['reports.export', 'Export reports'],
    ['settings.view', 'View settings'],
    ['settings.edit', 'Edit settings'],
  ];

  for (const [name, description] of permissions) {
    await pool.query(
      `INSERT INTO permissions (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [name, description]
    );
  }
}

export async function assignDefaultPermissions() {
  const permissionMap = {
    super_administrator: [
      'users.view','users.create','users.edit','users.delete',
      'projects.view','projects.create','projects.edit','projects.delete',
      'pages.view','pages.create','pages.edit','pages.publish','pages.delete',
      'posts.view','posts.create','posts.edit','posts.publish','posts.delete',
      'events.create','events.edit','events.publish','events.delete',
      'media.view','media.upload','media.delete',
      'impact.view','impact.create','impact.edit','impact.delete',
      'reports.view','reports.export',
      'settings.view','settings.edit',
    ],
    administrator: [
      'projects.view','projects.create','projects.edit',
      'pages.view','pages.create','pages.edit','pages.publish',
      'posts.view','posts.create','posts.edit','posts.publish',
      'events.create','events.edit','events.publish',
      'media.view','media.upload',
      'impact.view','impact.create','impact.edit',
      'reports.view','reports.export',
    ],
    project_manager: [
      'projects.view','projects.edit',
      'posts.view','posts.create','posts.edit',
      'media.view','media.upload',
      'impact.view','impact.create','impact.edit',
      'reports.view',
    ],
    content_editor: [
      'pages.view','pages.create','pages.edit',
      'posts.view','posts.create','posts.edit','posts.publish',
      'events.create','events.edit','events.publish',
      'media.view','media.upload',
      'reports.view',
    ],
    impact_officer: [
      'impact.view','impact.create','impact.edit',
      'projects.view',
      'reports.view','reports.export',
    ],
    viewer: [
      'projects.view',
      'reports.view',
      'pages.view',
      'posts.view',
    ],
  };

  for (const [roleName, permissionNames] of Object.entries(permissionMap)) {
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (roleResult.rowCount === 0) continue;

    const roleId = roleResult.rows[0].id;

    for (const permissionName of permissionNames) {
      const permissionResult = await pool.query('SELECT id FROM permissions WHERE name = $1', [permissionName]);
      if (permissionResult.rowCount === 0) continue;
      const permissionId = permissionResult.rows[0].id;

      await pool.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [roleId, permissionId]
      );
    }
  }
}

export function hashPassword(password) {
  return crypto.pbkdf2Sync(String(password || ''), 'ipg-admin-salt', 100000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password, hash) {
  if (!password || !hash) return false;

  const candidateHash = hashPassword(password);
  const expected = Buffer.from(String(hash), 'hex');
  const actual = Buffer.from(candidateHash, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}

export async function ensureDefaultAdmin() {
  const approvedEmails = getApprovedAdminEmails();

  if (approvedEmails.length === 0) {
    return;
  }

  for (const email of approvedEmails) {
    const normalized = email.trim().toLowerCase();
    const existing = await pool.query(
      'SELECT id, password_hash FROM admins WHERE email = $1',
      [normalized]
    );

    if (existing.rowCount === 0) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'IPGAdmin2026!';
      await pool.query(
        'INSERT INTO admins (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, TRUE)',
        [normalized, process.env.ADMIN_NAME || 'Site Administrator', hashPassword(defaultPassword)]
      );
    } else if (!existing.rows[0].password_hash && process.env.ADMIN_PASSWORD) {
      await pool.query(
        'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [hashPassword(process.env.ADMIN_PASSWORD), normalized]
      );
    }

    const adminResult = await pool.query('SELECT id FROM admins WHERE email = $1', [normalized]);
    const adminId = adminResult.rows[0].id;
    await ensureUserRoleByEmail(normalized, 'super_administrator');
    await pool.query(
      'UPDATE admins SET updated_at = NOW() WHERE id = $1',
      [adminId]
    );
  }
}

export async function ensureUserRoleByEmail(email, roleName) {
  const adminResult = await pool.query('SELECT id FROM admins WHERE email = $1', [String(email).trim().toLowerCase()]);
  if (adminResult.rowCount === 0) return false;

  const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
  if (roleResult.rowCount === 0) return false;

  await pool.query(
    `INSERT INTO user_roles (admin_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT (admin_id, role_id) DO NOTHING`,
    [adminResult.rows[0].id, roleResult.rows[0].id]
  );

  return true;
}

export async function getUserPermissions(email) {
  const result = await pool.query(
    `SELECT DISTINCT p.name
     FROM admins a
     JOIN user_roles ur ON ur.admin_id = a.id
     JOIN roles r ON r.id = ur.role_id
     JOIN role_permissions rp ON rp.role_id = r.id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE a.email = $1 AND a.is_active = TRUE`,
    [String(email).trim().toLowerCase()]
  );

  return result.rows.map((row) => row.name);
}

export async function listRoles() {
  const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
  return result.rows;
}

export async function listUsers() {
  const result = await pool.query(`
    SELECT a.id, a.email, a.full_name, a.is_active, a.last_login_at, a.created_at,
           ARRAY_AGG(r.name ORDER BY r.name) AS roles
    FROM admins a
    LEFT JOIN user_roles ur ON ur.admin_id = a.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY a.id, a.email, a.full_name, a.is_active, a.last_login_at, a.created_at
    ORDER BY a.created_at DESC
  `);

  return result.rows;
}

export async function createUser({ fullName, email, roleName = 'viewer', status = 'active' }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [normalizedEmail]);

  if (existing.rowCount > 0) {
    const adminId = existing.rows[0].id;
    if (roleName) await ensureUserRoleByEmail(normalizedEmail, roleName);
    await pool.query('UPDATE admins SET full_name = COALESCE($1, full_name), is_active = $2, updated_at = NOW() WHERE id = $3', [fullName || null, status === 'active', adminId]);
    return { id: adminId, email: normalizedEmail };
  }

  const inserted = await pool.query(
    `INSERT INTO admins (email, full_name, is_active)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [normalizedEmail, fullName || null, status === 'active']
  );

  const created = inserted.rows[0];
  if (roleName) await ensureUserRoleByEmail(normalizedEmail, roleName);
  return created;
}

export async function findAdminByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM admins WHERE email = $1 AND is_active = TRUE',
    [String(email).trim().toLowerCase()]
  );

  return result.rows[0] || null;
}

export async function saveVerificationCode(email, code) {
  const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    'INSERT INTO verification_codes (email, code_hash, expires_at) VALUES ($1, $2, $3)',
    [String(email).trim().toLowerCase(), codeHash, expiresAt]
  );

  return { code, expiresAt };
}

export async function verifyCode(email, code) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');

  const result = await pool.query(
    `SELECT *
     FROM verification_codes
     WHERE email = $1
       AND code_hash = $2
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail, codeHash]
  );

  return result.rowCount > 0;
}

export async function listContributors() {
  const result = await pool.query(
    'SELECT * FROM contributors ORDER BY created_at DESC'
  );

  return result.rows;
}

export async function createContributor({ name, role, email, bio }) {
  const result = await pool.query(
    `INSERT INTO contributors (name, role, email, bio)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, role || null, email || null, bio || null]
  );

  return result.rows[0];
}

export async function listContent() {
  const result = await pool.query(
    `SELECT c.*, co.name AS contributor_name
     FROM content c
     LEFT JOIN contributors co ON co.id = c.contributor_id
     ORDER BY c.updated_at DESC`
  );

  return result.rows;
}

export async function createContent({ title, slug, body, category, status, contributorId }) {
  const normalizedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const result = await pool.query(
    `INSERT INTO content (title, slug, body, category, status, contributor_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [title, normalizedSlug, body, category || 'general', status || 'draft', contributorId || null]
  );

  return result.rows[0];
}

export async function updateContent(id, { title, slug, body, category, status, contributorId }) {
  const result = await pool.query(
    `UPDATE content
     SET title = COALESCE($1, title),
         slug = COALESCE($2, slug),
         body = COALESCE($3, body),
         category = COALESCE($4, category),
         status = COALESCE($5, status),
         contributor_id = COALESCE($6, contributor_id),
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [title, slug, body, category, status, contributorId, id]
  );

  return result.rows[0];
}

export async function deleteContent(id) {
  const result = await pool.query(
    'DELETE FROM content WHERE id = $1 RETURNING *',
    [id]
  );

  return result.rows[0];
}

export async function listProjects() {
  const result = await pool.query(
    `SELECT p.*,
            COALESCE(SUM(ir.people_reached), 0) AS people_reached,
            COALESCE(SUM(ir.households_reached), 0) AS households_reached,
            COALESCE(COUNT(ir.id), 0) AS activity_count,
            MAX(ir.activity_date) AS latest_activity
     FROM projects p
     LEFT JOIN impact_records ir ON ir.project_id = p.id
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  );

  return result.rows;
}

export async function createProject(project) {
  const { name, slug, description, mission, featuredImage, location, country, region, status, startDate, endDate, projectManager, createdBy } = project;
  const projectSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const result = await pool.query(
    `INSERT INTO projects (name, slug, description, mission, featured_image, location, country, region, status, start_date, end_date, project_manager, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
     RETURNING *`,
    [name, projectSlug, description || null, mission || null, featuredImage || null, location || null, country || null, region || null, status || 'active', startDate || null, endDate || null, projectManager || null, createdBy || null]
  );

  return result.rows[0];
}

export async function getProjectById(id) {
  const result = await pool.query(
    `SELECT p.*,
            COALESCE(SUM(ir.people_reached), 0) AS people_reached,
            COALESCE(SUM(ir.households_reached), 0) AS households_reached,
            COALESCE(COUNT(ir.id), 0) AS activity_count,
            MAX(ir.activity_date) AS latest_activity
     FROM projects p
     LEFT JOIN impact_records ir ON ir.project_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );

  return result.rows[0] || null;
}

export async function updateProject(id, updates) {
  const { name, slug, description, mission, featuredImage, location, country, region, status, startDate, endDate, projectManager } = updates;
  const projectSlug = slug || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const result = await pool.query(
    `UPDATE projects
     SET name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         description = COALESCE($3, description),
         mission = COALESCE($4, mission),
         featured_image = COALESCE($5, featured_image),
         location = COALESCE($6, location),
         country = COALESCE($7, country),
         region = COALESCE($8, region),
         status = COALESCE($9, status),
         start_date = COALESCE($10, start_date),
         end_date = COALESCE($11, end_date),
         project_manager = COALESCE($12, project_manager),
         updated_at = NOW()
     WHERE id = $13
     RETURNING *`,
    [name || null, projectSlug || null, description || null, mission || null, featuredImage || null, location || null, country || null, region || null, status || null, startDate || null, endDate || null, projectManager || null, id]
  );

  return result.rows[0] || null;
}

export async function deleteProject(id) {
  const result = await pool.query(
    'DELETE FROM projects WHERE id = $1 RETURNING *',
    [id]
  );

  return result.rows[0] || null;
}

export async function listPages() {
  const result = await pool.query('SELECT * FROM pages ORDER BY updated_at DESC');
  return result.rows;
}

export async function createPage(page) {
  const { title, slug, heroHeading, heroDescription, content, featuredImage, seoTitle, seoDescription, status, createdBy } = page;
  const pageSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const result = await pool.query(
    `INSERT INTO pages (title, slug, hero_heading, hero_description, content, featured_image, seo_title, seo_description, status, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     RETURNING *`,
    [title, pageSlug, heroHeading || null, heroDescription || null, content || null, featuredImage || null, seoTitle || null, seoDescription || null, status || 'draft', createdBy || null]
  );

  return result.rows[0];
}

export async function listPosts() {
  const result = await pool.query('SELECT * FROM posts ORDER BY publication_date DESC NULLS LAST, created_at DESC');
  return result.rows;
}

export async function createPost(post) {
  const { title, slug, excerpt, content, featuredImage, projectId, category, location, author, publicationDate, seoTitle, seoDescription, status, createdBy } = post;
  const postSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const result = await pool.query(
    `INSERT INTO posts (title, slug, excerpt, content, featured_image, project_id, category, location, author, publication_date, seo_title, seo_description, status, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
     RETURNING *`,
    [title, postSlug, excerpt || null, content || null, featuredImage || null, projectId || null, category || null, location || null, author || null, publicationDate || null, seoTitle || null, seoDescription || null, status || 'draft', createdBy || null]
  );

  return result.rows[0];
}

export async function listTestimonials() {
  const result = await pool.query('SELECT * FROM testimonials ORDER BY created_at DESC');
  return result.rows;
}

export async function createTestimonial(data) {
  const { name, roleDescription, location, testimonial, photo, projectId, status, createdBy } = data;
  const result = await pool.query(
    `INSERT INTO testimonials (name, role_description, location, testimonial, photo, project_id, status, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING *`,
    [name, roleDescription || null, location || null, testimonial, photo || null, projectId || null, status || 'draft', createdBy || null]
  );

  return result.rows[0];
}

export async function listEvents() {
  const result = await pool.query('SELECT * FROM events ORDER BY event_date DESC NULLS LAST');
  return result.rows;
}

export async function createEvent(data) {
  const { name, description, eventDate, location, projectId, featuredImage, registrationInfo, status, createdBy } = data;
  const result = await pool.query(
    `INSERT INTO events (name, description, event_date, location, project_id, featured_image, registration_info, status, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [name, description || null, eventDate || null, location || null, projectId || null, featuredImage || null, registrationInfo || null, status || 'draft', createdBy || null]
  );

  return result.rows[0];
}

export async function listMedia() {
  const result = await pool.query(`
    SELECT m.*, a.full_name AS uploaded_by_name
    FROM media m
    LEFT JOIN admins a ON a.id = m.uploaded_by
    ORDER BY m.created_at DESC
  `);
  return result.rows;
}

export async function createMedia(data) {
  const { fileName, url, caption, description, projectId, uploadedBy } = data;
  const result = await pool.query(
    `INSERT INTO media (file_name, url, caption, description, project_id, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [fileName, url, caption || null, description || null, projectId || null, uploadedBy || null]
  );

  return result.rows[0];
}

export async function listImpactRecords() {
  const result = await pool.query('SELECT * FROM impact_records ORDER BY activity_date DESC');
  return result.rows;
}

export async function createImpactRecord(data) {
  const { projectId, country, region, district, community, activityDate, activityType, householdsReached, peopleReached, childrenReached, adultsReached, womenReached, menReached, communitiesReached, description, outcome, notes, staffResponsible, createdBy } = data;
  const normalizedDate = activityDate || new Date().toISOString().slice(0, 10);

  const result = await pool.query(
    `INSERT INTO impact_records (
      project_id, country, region, district, community, activity_date, activity_type,
      households_reached, people_reached, children_reached, adults_reached,
      women_reached, men_reached, communities_reached, description, outcome, notes,
      staff_responsible, created_by, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11,
      $12, $13, $14, $15, $16, $17,
      $18, $19, NOW()
    ) RETURNING *`,
    [projectId || null, country || null, region || null, district || null, community || null, normalizedDate, activityType || null,
      householdsReached || 0, peopleReached || 0, childrenReached || 0, adultsReached || 0,
      womenReached || 0, menReached || 0, communitiesReached || 0, description || null, outcome || null, notes || null,
      staffResponsible || null, createdBy || null]
  );

  return result.rows[0];
}

function getDateRange(rangeName = 'this_month') {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  const normalized = String(rangeName || 'this_month').trim().toLowerCase();

  switch (normalized) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_quarter':
      start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
    case 'custom_range':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export async function getDashboardSummary(rangeName = 'this_month') {
  const { start, end } = getDateRange(rangeName);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const [projects, impact, posts, pages] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM projects
       WHERE created_at >= $1 AND created_at <= $2`,
      [startIso, endIso]
    ),
    pool.query(
      `SELECT COALESCE(SUM(CASE WHEN activity_date >= $1 AND activity_date <= $2 THEN people_reached ELSE 0 END), 0)::int AS people_reached,
              COALESCE(SUM(CASE WHEN activity_date >= $1 AND activity_date <= $2 THEN households_reached ELSE 0 END), 0)::int AS households_reached,
              COALESCE(SUM(CASE WHEN activity_date >= $1 AND activity_date <= $2 THEN children_reached ELSE 0 END), 0)::int AS children_reached,
              COALESCE(SUM(CASE WHEN activity_date >= $1 AND activity_date <= $2 THEN communities_reached ELSE 0 END), 0)::int AS communities_reached,
              COALESCE(COUNT(CASE WHEN activity_date >= $1 AND activity_date <= $2 THEN 1 END), 0)::int AS records
       FROM impact_records`,
      [startIso, endIso]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM posts WHERE status = $1 AND created_at >= $2 AND created_at <= $3`,
      ['published', startIso, endIso]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM pages WHERE status = $1 AND created_at >= $2 AND created_at <= $3`,
      ['published', startIso, endIso]
    ),
  ]);

  return {
    totalProjects: Number(projects.rows[0]?.total || 0),
    totalPeopleReached: Number(impact.rows[0]?.people_reached || 0),
    totalHouseholdsReached: Number(impact.rows[0]?.households_reached || 0),
    totalChildrenReached: Number(impact.rows[0]?.children_reached || 0),
    totalCommunitiesReached: Number(impact.rows[0]?.communities_reached || 0),
    totalImpactRecords: Number(impact.rows[0]?.records || 0),
    publishedPosts: Number(posts.rows[0]?.total || 0),
    publishedPages: Number(pages.rows[0]?.total || 0),
    totalActivities: Number(impact.rows[0]?.records || 0),
  };
}

export async function createAuditLog(adminId, action, resource, details, result = 'success') {
  await pool.query(
    `INSERT INTO audit_logs (admin_id, action, resource, details, result)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId || null, action, resource || null, details || null, result]
  );
}

export { pool };
