import { initDb } from './db.js';

try {
  await initDb();
  console.log('Database schema initialized successfully.');
  process.exit(0);
} catch (error) {
  console.error('Database initialization failed.', error);
  process.exit(1);
}
