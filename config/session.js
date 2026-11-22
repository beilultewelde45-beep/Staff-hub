import session from 'express-session';
import { MongoStore } from 'connect-mongo';
import mongoose from 'mongoose';
import { env } from './env.js';

const EIGHT_HOURS = 8 * 60 * 60;

/**
 * Session middleware backed by the already-open Mongoose connection,
 * so sessions survive restarts and tests can use the in-memory server.
 */
export function createSessionMiddleware({ secret = env.sessionSecret } = {}) {
  return session({
    name: 'staffhub.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: 'sessions',
      ttl: EIGHT_HOURS,
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProd,
      maxAge: EIGHT_HOURS * 1000,
    },
  });
}
