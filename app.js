const path = require('path');
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// LOAD SECURITY MODULES
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// LOAD OPTIMIZATION MODULE
const compression = require('compression');

// LOAD ROUTES
const reviewRouter = require('./components/review/reviewRoutes');
const tourRouter = require('./components/tour/tourRoutes');
const userRouter = require('./components/user/userRoutes');
const viewRouter = require('./components/view/viewRoutes');
const bookingRouter = require('./components/booking/bookingRoutes');
const bookingController = require('./components/booking/bookingController');
const testRouter = require('./components/test/testRoutes');

const AppError = require('./utils/appError');
const globalErrorController = require('./components/global/errorController');

const env = process.env.NODE_ENV || 'development';

const app = express();

app.enable('trust proxy');

/** ------------------------
 * ------ VIEW ENGINE ------
 * ------------------------- */
app.set('view engine', 'pug');
app.set('views', [
  path.resolve(__dirname, 'views'),
  path.resolve(__dirname, 'views/pages')
]);

/** ------------------------------
 * ------ GLOBAL MIDDLEWARE ------
 * ------------------------------- */
// Implement CORS
app.use(cors());
app.options('*', cors());

// Set security HTTP headers
app.use(helmet());

// Development logger
if (env === 'development') app.use(logger('dev'));

// Rate limitter (prevent DDoS or brute force attack)
if (env === 'production') {
  const limiter = rateLimit({
    max: 100, // 100 requests
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP. Please try again in 1 hour.'
  });
  app.use('/api', limiter);
}

// The body of Stripe request needs to be in raw form (before being converted to json)
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// JSON body parser (parse request body and populate req.body)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Cookie parser (parse cookie header and populate req.cookies)
app.use(cookieParser());

// Data sanitization against NoSQL attack
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevents parameter pollution
app.use(hpp());

// Searving static files
app.use(express.static(path.resolve(__dirname, 'public')));

// Compress server response
app.use(compression());

// Custom test middleware
app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

/** --------------------
 * ------ ROUTING ------
 * --------------------- */
// API routes
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);

// Test routes
app.use('/test', testRouter);

// Serving templates
app.use('/', viewRouter);

/** ---------------------------------
 * ------ GLOBAL ERROR HANDLER ------
 * ---------------------------------- */
// Undefined route handler
app.all('*', (req, _res, next) => {
  // const err = new Error(`Cannot find ${req.originalUrl} on the server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  const error = new AppError(
    `Cannot find ${req.originalUrl} on the server`,
    404
  );

  next(error); // passing err in next() will skip all followings middleware and go to error handling middleware
});

// Global Error Handler
app.use(globalErrorController);

module.exports = app;
