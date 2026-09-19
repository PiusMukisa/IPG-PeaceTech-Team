# IPG Admin Backend

This backend adds an admin-only login, PostgreSQL data storage, and a protected dashboard for managing content and contributors.

## Setup

1. Copy the project root `.env.example` file to `.env` if you are using a root-level env file.
2. Set `DATABASE_URL` to your Supabase PostgreSQL connection string.
3. Keep the database password and any secret values on the server only. Do not commit `.env`.
4. Install dependencies from the project root.
5. Start the backend with `npm run server`.

## Admin route

- Login page: `/admin/login`
- Dashboard: `/admin/dashboard`

## Notes

- Only approved admin emails can log in. Add them to `APPROVED_ADMIN_EMAILS` in `.env` as a comma-separated list.
- A 6-digit email verification code is sent to the admin email before the session is created.
- All website content and contributor data are stored in Supabase PostgreSQL.
- This app does not create Supabase Auth users automatically. Admin access is managed by the server-side `admins` table and verification code flow.
