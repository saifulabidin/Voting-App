const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error:', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Enhanced CORS error handling
  if (err.name === 'CORSError' || (err.message && err.message.includes('CORS'))) {
    // Set CORS headers even in error responses
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://voting-app-fullstack.netlify.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    return res.status(403).json({
      status: 'error',
      code: 'CORS_ERROR',
      message: 'Cross-Origin Request Blocked',
      details: process.env.NODE_ENV === 'development' ? {
        origin: req.headers.origin,
        method: req.method,
        path: req.path,
        allowedOrigin: process.env.FRONTEND_URL || 'https://voting-app-fullstack.netlify.app'
      } : undefined
    });
  }

  // Handle MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({
      status: 'error',
      code: 'DB_ERROR',
      message: 'Database service unavailable'
    });
  }

  // Handle path-to-regexp errors
  if (err instanceof TypeError && err.message.includes('Missing parameter name')) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_URL',
      message: 'Invalid URL format'
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

  // Handle network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
    return res.status(503).json({
      status: 'error',
      code: 'NETWORK_ERROR',
      message: 'Service temporarily unavailable'
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