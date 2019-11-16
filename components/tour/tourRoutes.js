const express = require('express');
const hpp = require('hpp');

const reviewRouter = require('./../review/reviewRoutes');

const tourController = require('./tourController');
const authController = require('./../global/authController');
const bookingController = require('./../booking/bookingController');

const router = express.Router();

// router.param('id', tourController.checkID);

// Prevents parameter pollution with exceptions
router.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

router.route('/test').get((req, res) => {
  res.status(200).end();
});

// Rerouting to review
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/monthly-plan/:year')
  .get(authController.protect, tourController.getMonthlyPlan);

router
  .route('/top5')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.get('/tour-stats', tourController.getTourStats);

router.get(
  '/within-distance/:distance/center/:latlng/unit/:unit',
  tourController.getTourWitin
);

router.get('/distances/:latlng/unit/:unit', tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

router
  .route('/:id/bookings')
  .get(tourController.setParamsTourIdQuery, bookingController.getAllBookings);

module.exports = router;
