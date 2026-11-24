// In-memory MongoDB replica set (transactions work, no Atlas needed).
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

export async function startDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri('staffhub-test'));
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // build unique indexes
}

export async function stopDb() {
  await mongoose.disconnect();
  await replSet?.stop();
}

/** Empty every collection. Uses the raw driver so model delete-guards (AuditLog) don't block it. */
export async function clearDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}
