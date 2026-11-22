import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import helmet from 'helmet';
import methodOverride from 'method-override';
import flash from 'connect-flash';
import { csrfSync } from 'csrf-sync';

import { env } from './config/env.js';
import { createSessionMiddleware } from './config/session.js';
import { loadUser, requireAuth } from './middleware/auth.js';
import { locals } from './middleware/locals.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Build the Express app. Mongoose must already be connected (sessions use its client).
 * @param {object} [options]
 * @param {string} [options.sessionSecret]
 * @param {number} [options.loginRateLimit]  failed logins per minute per IP
 */
export function createApp({ sessionSecret = env.sessionSecret, loginRateLimit = 5 } = {}) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.set('layout', 'layouts/main');
  if (env.isProd) app.set('trust proxy', 1); // Render terminates TLS in front of us
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(express.static(path.join(__dirname, 'public'), { maxAge: env.isProd ? '7d' : 0 }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(express.json({ limit: '100kb' }));
  // HTML forms can only GET/POST: a hidden `_method` field turns POST into PATCH/DELETE.
  app.use(
    methodOverride((req) => {
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        const method = req.body._method;
        delete req.body._method;
        return method;
      }
      return undefined;
    }),
  );

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use(createSessionMiddleware({ secret: sessionSecret }));
  app.use(flash());

  const { csrfSynchronisedProtection, generateToken } = csrfSync({
    getTokenFromRequest: (req) => req.body?._csrf ?? req.get('x-csrf-token'),
  });
  app.use(csrfSynchronisedProtection);

  app.use(loadUser);
  app.use(locals(generateToken));
  app.use(expressLayouts);

  // Public routes
  app.use(authRouter({ loginRateLimit }));

  // Everything below requires a signed-in, active user (BR-A1, BR-A7)
  app.use(requireAuth);
  app.use(dashboardRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
