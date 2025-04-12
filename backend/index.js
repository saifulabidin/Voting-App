const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
require('dotenv').config();
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy settings for Railway
app.set('trust proxy', true);

// CORS configuration - must be first in middleware chain
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://voting-app-fullstack.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours in seconds
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Request logging
app.use(requestLogger);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Parse JSON bodies
app.use(express.json());

// MongoDB Connection - use MONGO_URI from Railway
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Session configuration with MongoStore
const sessionStore = MongoStore.create({
  mongoUrl: mongoUri,
  collectionName: 'sessions',
  ttl: 24 * 60 * 60, // 1 day
  autoRemove: 'native',
  touchAfter: 24 * 3600 // time period in seconds
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Rate limiting based on environment variables
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000; // Convert minutes to ms
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

const authLimiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMax,
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Redirect /auth/google and /auth/google/callback to /api/auth/google and /api/auth/google/callback
app.use('/auth/google', (req, res, next) => {
  req.url = '/api/auth/google';
  next();
});

app.use('/auth/google/callback', (req, res, next) => {
  req.url = '/api/auth/google/callback';
  next();
});

// Routes
app.use('/api', require('./routes/index'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/polls', require('./routes/poll'));

// Health check endpoint with detailed status
app.get('/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.json({ 
    status: isMongoConnected ? 'healthy' : 'unhealthy',
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Only start server if MongoDB connects successfully
mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
