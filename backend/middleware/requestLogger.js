const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Log request
  console.log({
    id: requestId,
    timestamp: new Date().toISOString(),
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    },
    ip: req.ip
  });

  // Log response
  res.on('finish', () => {
    console.log({
      id: requestId,
      timestamp: new Date().toISOString(),
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      contentLength: res.get('content-length'),
      cors: {
        origin: res.get('access-control-allow-origin'),
        methods: res.get('access-control-allow-methods'),
        credentials: res.get('access-control-allow-credentials')
      }
    });
  });

  next();
};

module.exports = requestLogger;