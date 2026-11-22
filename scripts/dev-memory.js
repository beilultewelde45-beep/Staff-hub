// Run StaffHub against a throwaway in-memory MongoDB (no Atlas needed).
// Data is lost when the process stops. Usage: npm run dev:mem
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { createApp } from '../app.js';
import { seedUsers, DEMO_PASSWORD } from '../seed/seed.js';

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
await connectDB(replSet.getUri('staffhub'));
await seedUsers();

const app = createApp({ sessionSecret: env.sessionSecret || 'dev-memory-secret' });
const server = app.listen(env.port, () => {
  console.log(`StaffHub (in-memory DB) on http://localhost:${env.port}`);
  console.log(`Sign in as e.g. employee@staffhub.test / ${DEMO_PASSWORD}`);
});

async function shutdown() {
  server.close();
  await replSet.stop();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
