const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 3000;

// Add trust proxy if behind reverse proxy
app.set('trust proxy', 1);

// Enable CORS pre-flight for all routes
app.options('*', cors());

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      frameSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"]
    }
  }
}));

// Session configuration with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.NODE_ENV === 'production' ? '.railway.app' : undefined
  },
  name: 'sessionId',
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600, // Only update session once per day
    crypto: {
      secret: process.env.SESSION_SECRET
    }
  })
}));

app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Fix: Changed from '/api/' to '/api' to avoid path-to-regexp error
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/polls', require('./routes/poll'));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1;
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // System status check
    const systemStatus = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // Convert to MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      }
    };

    if (!dbStatus) {
      throw new Error('Database connection lost');
    }

    res.json({
      status: 'healthy',
      database: { connected: dbStatus },
      system: systemStatus,
      message: 'All systems operational'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      message: 'System experiencing issues'
    });
  }
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendStatus(204);
});

// 404 handler
app.use((req, res, next) => {
  const err = new Error('Route not found');
  err.name = 'NotFoundError';
  next(err);
});

// Error handler
app.use(errorHandler);

// Wrap server startup in async function for better error handling
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Only start server after successful DB connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      try {
        await mongoose.connection.close();
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
