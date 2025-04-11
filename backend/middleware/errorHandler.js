const errorHandler = (err, req, res, next) => {
  // Log error with request context
  console.error('Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle different error types
  switch (true) {
    case err.name === 'ValidationError':
      return res.status(400).json({
        status: 'error',
        message: Object.values(err.errors).map(e => e.message)
      });

    case err.code === 11000:
      return res.status(409).json({
        status: 'error',
        message: 'Resource already exists'
      });

    case err.name === 'NotFoundError':
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found'
      });

    case err.name === 'CSPError':
      return res.status(403).json({
        status: 'error',
        message: 'Content Security Policy violation'
      });

    default:
      return res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message
      });
  }
};

module.exports = errorHandler;