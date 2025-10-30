const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// Structured logging
const expressHbs = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');

require('./config/passport');

// Security packages
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { httpLogger, log } = require('./lib/logger');
const { initializeFlagsmith, flagsmithMiddleware } = require('./lib/flagsmith');

const indexRouter = require('./routes/index');

const app = express();

// Initialize Flagsmith
initializeFlagsmith();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping');
// Mongo connection logging
mongoose.connection.on('connected', () => {
  log.info({ mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping' }, 'MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  log.error({ err }, 'MongoDB connection error');
});
mongoose.connection.on('disconnected', () => {
  log.warn('MongoDB disconnected');
});

// view engine setup
app.engine('.hbs', expressHbs({
  defaultLayout: 'layout',
  extname: '.hbs',
  helpers: {
    eq(a, b) {
      return a === b;
    }
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', '.hbs');

// Security Middleware
// 1. Helmet - Set security HTTP headers with MITM protection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://stackpath.bootstrapcdn.com',
        'https://cdnjs.cloudflare.com',
        'https://use.fontawesome.com'
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://code.jquery.com',
        'https://cdnjs.cloudflare.com',
        'https://stackpath.bootstrapcdn.com'
      ],
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://use.fontawesome.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  }
}));

// 2. MongoDB sanitization - Prevent NoSQL injection
app.use(mongoSanitize());

// 3. Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

// 4. General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

// Request logging (JSON/pretty depending on env)
app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sessions with secure settings
// Allow override via SESSION_SECURE env (useful for minikube HTTP port-forward)
const sessionSecure = process.env.SESSION_SECURE === 'true'
  || (process.env.SESSION_SECURE === undefined && process.env.NODE_ENV === 'production');
const sessionSameSite = process.env.SESSION_SAME_SITE || 'strict';

app.use(session({
  secret: process.env.SESSION_SECRET || 'rockndogs-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents XSS attacks by making cookie inaccessible to JavaScript
    secure: sessionSecure, // Only send cookie over HTTPS in production (override with SESSION_SECURE=false)
    sameSite: sessionSameSite, // Prevents CSRF attacks
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Trust proxy for HTTPS behind reverse proxy (nginx, heroku, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
}

// Flagsmith middleware - attach feature flags to request
app.use(flagsmithMiddleware()); // eslint-disable-line max-len

// Expose auth/cart info to templates
app.use(function (req, res, next) {
  // Prevent caching of authenticated pages
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  res.locals.isAuthenticated = !!req.user;
  res.locals.user = req.user;
  res.locals.cart = req.session.cart || { totalQty: 0, totalPrice: 0, items: [] };
  res.locals.year = new Date().getFullYear();

  // Debug logging for shop/product routes
  if (req.path.includes('/shop/') || req.path.includes('/product/')) {
    log.debug({ path: req.path, isAuthenticated: res.locals.isAuthenticated, user: req.user ? req.user.email : 'none' }, 'Shop/Product request');
  }

  next();
});
/* app.use(expressLayouts);
app.use(ejs);
app.use(engine); */

app.use('/', indexRouter);
// Apply rate limiting to auth routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/cart'));
// API routes with rate limiting
app.use('/api', apiLimiter, require('./routes/api'));

// Make rate limiters available to routes
app.set('loginLimiter', loginLimiter);
app.set('apiLimiter', apiLimiter);

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // Log the error with request context
  log.error({ err }, 'Unhandled error');
  res.render('error');
});

module.exports = app;
