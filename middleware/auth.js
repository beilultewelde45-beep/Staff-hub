import { User } from '../models/User.js';
import { ForbiddenError } from '../utils/errors.js';

export const DEACTIVATED_MESSAGE = 'This account has been deactivated. Contact HR.';

/**
 * Load the signed-in user on every request. `isActive` is re-checked each time,
 * so deactivating an account logs it out immediately (BR-A7).
 */
export async function loadUser(req, res, next) {
  try {
    req.user = null;
    const userId = req.session?.userId;
    if (!userId) return next();

    const user = await User.findById(userId).lean();
    if (!user || !user.isActive) {
      delete req.session.userId;
      if (user && req.flash) req.flash('error', DEACTIVATED_MESSAGE);
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Every page except /login, /health and the public careers site needs a session (BR-A1). */
export function requireAuth(req, res, next) {
  if (req.user) return next();
  if (req.method === 'GET' && req.session) req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
}

/** Allow the request if the user holds at least one of the roles (BR-A2). */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    if (roles.some((r) => req.user.roles.includes(r))) return next();
    return next(new ForbiddenError());
  };
}
