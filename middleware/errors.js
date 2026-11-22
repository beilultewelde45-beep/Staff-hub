import { ValidationError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export function notFound(req, res, next) {
  next(new NotFoundError());
}

function safeBack(req) {
  // Only redirect back to our own pages (Referer can be spoofed).
  const ref = req.get('Referer');
  try {
    const url = new URL(ref, `${req.protocol}://${req.get('host')}`);
    if (url.host === req.get('host')) return url.pathname + url.search;
  } catch {
    /* fall through */
  }
  return '/';
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const layout = req.user ? 'layouts/main' : 'layouts/public';
  // Errors thrown before the locals middleware (e.g. CSRF) still need these for the layout.
  res.locals.flash ??= { success: [], error: [] };
  res.locals.currentUser ??= null;
  res.locals.nav ??= [];
  res.locals.csrfToken ??= '';

  if (err instanceof ValidationError) {
    if (req.flash) req.flash('error', err.message);
    return res.redirect(safeBack(req));
  }
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('errors/403', {
      layout,
      title: 'Session expired',
      message: 'Your form expired or was submitted twice. Go back, reload the page and try again.',
    });
  }
  if (err instanceof ForbiddenError) {
    return res.status(403).render('errors/403', { layout, title: 'Access denied', message: err.message });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).render('errors/404', { layout, title: 'Not found' });
  }

  console.error(err);
  res.status(500).render('errors/500', { layout, title: 'Something went wrong' });
}
