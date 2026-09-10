/**
 * Centralized error handler. Normalizes Mongoose validation/cast errors and
 * duplicate-key errors into a consistent JSON shape so the frontend never
 * has to special-case error formats per-endpoint.
 */
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // An error may carry its own status (`err.status`, the Express convention).
  // That matters for errors thrown deep in a helper, where there is no response
  // object to call `res.status()` on before throwing — without this they would
  // all surface as 500s regardless of what actually went wrong.
  const carried = Number(err.status || err.statusCode);
  const fromError = Number.isInteger(carried) && carried >= 400 && carried <= 599 ? carried : null;

  let statusCode =
    fromError || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Server error';
  let details;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field '${field}'`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}

module.exports = { notFound, errorHandler };
