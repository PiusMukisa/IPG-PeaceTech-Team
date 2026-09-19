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

export async function initDb() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

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
      CREATE INDEX IF NOT EXISTS idx_verification_email
      ON verification_codes (email);
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

    await ensureDefaultAdmin();
  } finally {
    client.release();
  }
}

export async function ensureDefaultAdmin() {
  const approvedEmails = getApprovedAdminEmails();

  if (approvedEmails.length === 0) {
    return;
  }

  for (const email of approvedEmails) {
    const existing = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (existing.rowCount === 0) {
      await pool.query(
        'INSERT INTO admins (email, full_name, is_active) VALUES ($1, $2, TRUE)',
        [email, process.env.ADMIN_NAME || 'Site Administrator']
      );
    }
  }
}

export async function findAdminByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM admins WHERE email = $1 AND is_active = TRUE',
    [email.trim().toLowerCase()]
  );

  return result.rows[0] || null;
}

export async function saveVerificationCode(email, code) {
  const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    'INSERT INTO verification_codes (email, code_hash, expires_at) VALUES ($1, $2, $3)',
    [email.trim().toLowerCase(), codeHash, expiresAt]
  );

  return { code, expiresAt };
}

export async function verifyCode(email, code) {
  const normalizedEmail = email.trim().toLowerCase();
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

export { pool };
