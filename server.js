import { env, assertRuntimeEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  assertRuntimeEnv();
  await connectDB(env.mongoUri);
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`StaffHub running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
