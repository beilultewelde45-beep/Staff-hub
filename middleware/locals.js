import { buildNav } from '../config/nav.js';
import { ROLE_LABELS } from '../config/roles.js';
import { fmt, fmtDate, fmtTime, fmtDateTime, nowKampala } from '../utils/time.js';
import { fmtUGX } from '../utils/money.js';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase();
}

/** Values every view can use: current user, nav, flash, CSRF token, formatting helpers. */
export function locals(generateCsrfToken) {
  return (req, res, next) => {
    const user = req.user ?? null;
    res.locals.currentUser = user;
    res.locals.currentPath = req.path;
    res.locals.nav = user ? buildNav(user, req.path) : [];
    res.locals.userInitials = user ? initials(user.displayName) : '';
    res.locals.roleLabels = ROLE_LABELS;
    res.locals.csrfToken = req.session ? generateCsrfToken(req) : '';
    // Read flash lazily: messages are consumed only when a page actually renders,
    // so they survive redirects (e.g. "account deactivated" → /login).
    let flash;
    Object.defineProperty(res.locals, 'flash', {
      enumerable: true,
      configurable: true,
      get() {
        flash ??= {
          success: req.flash ? req.flash('success') : [],
          error: req.flash ? req.flash('error') : [],
        };
        return flash;
      },
      set(value) {
        flash = value;
      },
    });
    res.locals.now = nowKampala();
    Object.assign(res.locals, { fmt, fmtDate, fmtTime, fmtDateTime, fmtUGX });
    res.locals.title = 'StaffHub';
    next();
  };
}
