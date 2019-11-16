const express = require('express');

const userController = require('./userController');
const authController = require('./../global/authController');
const bookingController = require('./../booking/bookingController');

const router = express.Router();

// PUBLIC ROUTES
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/login-totp', authController.loginTotp);
router.get('/logout', authController.logout);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.patch('/email-confirm/:token', authController.emailConfirm);

// PRIVATE ROUTES
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);

router
  .route('/me')
  .get(userController.getMe, userController.getUser)
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  )
  .delete(userController.deleteMe);

router.patch('/me/two-factor', authController.updateTwoFactor);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser);

router
  .route('/:id/bookings')
  .get(userController.setParamsUserIdQuery, bookingController.getAllBookings);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

module.exports = router;
