const express = require('express');
const viewController = require('./viewController');
const authController = require('./../global/authController');
// const bookingController = require('./../booking/bookingController');

const router = express.Router();

router.use(viewController.alerts);

router.get(
  '/tour/:slug',
  authController.isLoggedIn,
  // authController.redirectHomeIfNotLoggedIn,
  viewController.getTour
);

router.get('/signup', viewController.getSignupForm);
router.get('/email-confirm/:token', viewController.getEmailConfirm);

router.get(
  '/login',
  authController.isLoggedIn,
  authController.redirectHomeIfLoggedIn,
  viewController.getLoginForm
);

router.get(
  '/login-totp',
  authController.emailProvided,
  viewController.getLoginWithTotp
);

router.get('/forgot-password', viewController.getForgotPasswordForm);
router.get('/reset-password/:token', viewController.getResetPasswordForm);

router.get(
  '/me',
  authController.isLoggedIn,
  authController.redirectHomeIfNotLoggedIn,
  viewController.getMe
);

router.get(
  '/my-bookings',
  authController.isLoggedIn,
  authController.redirectHomeIfNotLoggedIn,
  viewController.getMyBookings
);

router.get(
  '/',
  // bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

module.exports = router;
