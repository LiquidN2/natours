const AppError = require('./../../utils/appError');

// Handle casting error from Mongoose
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle duplication error from Mongoose validation
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const message = `Duplicate field value ${value}. Please use a different value.`;
  return new AppError(message, 400);
};

// Handle ValidationError from Mongoose
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = errors.join('. ');
  return new AppError(message, 400);
  // return new AppError(err.message, 400);
};

// Handle JWT Validation
const handleJWTError = err => {
  const message = 'Invalid or expired token. Please login again.';
  return new AppError(message, 401);
};

// Send error in PRODUCTION environment
const sendErrorProd = (err, req, res) => {
  // API error handling
  if (req.originalUrl.startsWith('/api')) {
    // if error is operational
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });

      // if error is unknown, don't leak error details
    }
    // 1. Log error to console
    console.error('Error 💥', err);

    // 2. Send generic error message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }

  // Rendered error page for non-Api error
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.isOperational ? err.message : 'Please try again later'
  });
};

// Send error in DEVELOPMENT environment
const sendErrorDev = (err, req, res) => {
  // API error handling
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }

  // Rendered error page for non-Api error
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message
  });
};

// ERROR HANDLER
module.exports = (err, req, res, _next) => {
  const env = process.env.NODE_ENV || 'development';

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (env === 'development') {
    sendErrorDev(err, req, res);
  } else if (env === 'production') {
    let error = { ...err };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'MongoError' && error.code === 11000)
      error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    )
      error = handleJWTError(error);

    sendErrorProd(error, req, res);
  }
};
