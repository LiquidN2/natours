const Tour = require('./../tour/tourModel');
const Booking = require('./../booking/bookingModel');
const Review = require('./../review/reviewModel');
const StartDate = require('./../startDate/startDateModel');
const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');

const getOverview = catchAsync(async (req, res, next) => {
  // 1. Get data
  const tours = await Tour.find()
    .select('-guides -description -images')
    .populate('startDates');

  // 2. Render template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

const getTour = catchAsync(async (req, res, next) => {
  // 1. Get data
  const tour = await Tour.findOne({ slug: req.params.slug });

  if (!tour) {
    const error = new AppError('Unable to find tour with that name', 404);
    return next(error);
  }

  const reviews = await Review.find({ tour: tour._id });

  const startDates = await StartDate.find({ tour: tour._id });

  // 2. Render template
  res.status(200).render('tour', {
    title: tour.name,
    tour,
    reviews,
    startDates
  });
});

const getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

const getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign up a new account'
  });
};

const getForgotPasswordForm = (req, res) => {
  res.status(200).render('forgot-password', {
    title: 'Forgot Password'
  });
};

const getResetPasswordForm = (req, res) => {
  res.status(200).render('reset-password', {
    title: 'Reset Your Password',
    token: req.params.token
  });
};

const getMe = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'My account page',
    user: req.user
  });
});

const getMyBookings = catchAsync(async (req, res, next) => {
  const myBookings = await Booking.find({ user: req.user.id }).select({
    tour: 1,
    user: 0
  });

  const myTourIds = myBookings.map(booking => booking.tour._id);

  const myTours = await Tour.find({ _id: { $in: myTourIds } });

  res.status(200).render('overview', {
    title: 'My booked tours',
    tours: myTours
  });
});

const getEmailConfirm = (req, res, next) => {
  res.status(200).render('email-confirm', {
    title: 'Email Confirmation',
    token: req.params.token
  });
};

const getLoginWithTotp = (req, res, next) => {
  res.status(200).render('login-totp', {
    title: 'Login with 6-digit code'
  });
};

module.exports = {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getForgotPasswordForm,
  getResetPasswordForm,
  getMe,
  getMyBookings,
  getEmailConfirm,
  getLoginWithTotp
};
