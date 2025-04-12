const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error:', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle CORS errors
  if (err.name === 'TypeError' && err.message.includes('CORS')) {
    return res.status(400).json({
      status: 'error',
      code: 'CORS_ERROR',
      message: 'CORS validation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle path-to-regexp errors
  if (err instanceof TypeError && err.message.includes('Missing parameter name')) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_URL',
      message: 'Invalid URL format',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Handle MongoDB errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_ID',
      message: 'Invalid ID format',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      code: 'AUTH_ERROR',
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle rate limit errors
  if (err.name === 'RateLimitExceeded') {
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      retryAfter: err.retryAfter
    });
  }

  // Default error
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: status === 500 ? 'Internal server error' : err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;