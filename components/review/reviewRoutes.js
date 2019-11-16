const express = require('express');

const bookingController = require('./../booking/bookingController');
const reviewController = require('./reviewController');
const authController = require('./../global/authController');

const router = express.Router({ mergeParams: true });

router.route('/test').get((req, res) => {
  res.status(200).end();
});

router.use(authController.protect);

// @route /api/v1/reviews
// @route /api/v1/tours/:tourId/reviews rerouting and merge params
router
  .route('/')
  .get(reviewController.setTourIdQuery, reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.checkExistingReview, // prevent duplicate reviews for same tour from same review
    bookingController.tourIsBookedByUser, // only allow user to review a booked tour
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.checkReviewOwner,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.checkReviewOwner,
    reviewController.deleteReview
  );

module.exports = router;
