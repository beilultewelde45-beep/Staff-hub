import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { burnPasswordCheck } from '../utils/password.js';
import { DEACTIVATED_MESSAGE } from '../middleware/auth.js';

export const INVALID_LOGIN_MESSAGE = 'Invalid email or password.';

function renderLogin(res, status, { error = '', email = '' } = {}) {
  return res.status(status).render('auth/login', { layout: 'layouts/public', title: 'Sign in', error, email });
}

function safeReturnTo(value) {
  // Only same-site relative paths ("/x", not "//evil.com").
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export function authRouter({ loginRateLimit = 5 } = {}) {
  const router = Router();

  // 5 failed attempts per minute per IP; successful logins don't count.
  const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: loginRateLimit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) =>
      renderLogin(res, 429, {
        error: 'Too many sign-in attempts. Wait a minute and try again.',
        email: req.body?.email ?? '',
      }),
  });

  router.get('/login', (req, res) => {
    if (req.user) return res.redirect('/');
    renderLogin(res, 200);
  });

  router.post(
    '/login',
    loginLimiter,
    body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email address.'),
    body('password').isString().notEmpty().withMessage('Enter your password.'),
    async (req, res, next) => {
      try {
        const email = typeof req.body.email === 'string' ? req.body.email : '';
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return renderLogin(res, 400, { error: errors.array()[0].msg, email });
        }

        const user = await User.findOne({ email }).select('+passwordHash');
        const ok = user ? await user.checkPassword(req.body.password) : await burnPasswordCheck(req.body.password);
        if (!ok) return renderLogin(res, 401, { error: INVALID_LOGIN_MESSAGE, email });

        // Only reveal the account state to someone who knows the password.
        if (!user.isActive) return renderLogin(res, 403, { error: DEACTIVATED_MESSAGE, email });

        const returnTo = safeReturnTo(req.session.returnTo);
        // New session id on login prevents session fixation.
        req.session.regenerate((err) => {
          if (err) return next(err);
          req.session.userId = String(user._id);
          req.session.save(async (saveErr) => {
            if (saveErr) return next(saveErr);
            await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
            res.redirect(returnTo);
          });
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('staffhub.sid');
      res.redirect('/login');
    });
  });

  return router;
}
