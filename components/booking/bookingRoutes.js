const express = require('express');

const bookingController = require('./bookingController');
const authController = require('./../global/authController');
const utilMiddleware = require('./../global/utilMiddleware');

const router = express.Router();

router.use(authController.protect);

// router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
router.get(
  '/checkout-session/tour/:tourId/date/:dateId',
  bookingController.getCheckoutSession
);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.updateBooking
  )
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    bookingController.deleteBooking
  );

router
  .route('/')
  .get(utilMiddleware.setUserIdIn('query'), bookingController.getAllBookings) // get own bookings
  .post(utilMiddleware.setUserIdIn('body'), bookingController.createBooking); // create own booking

module.exports = router;
