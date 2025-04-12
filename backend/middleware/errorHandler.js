const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle path-to-regexp errors
  if (err.name === 'TypeError' && err.message.includes('Missing parameter name')) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid route parameters',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Handle cast errors (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid parameter format',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid authentication token'
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;