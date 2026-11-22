export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

/** Business-rule or input violation: shown to the user as a flash message. */
export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400);
    this.details = details;
  }
}

/** Signed in, but not allowed (role or ownership). */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do that.') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Page not found.') {
    super(message, 404);
  }
}
