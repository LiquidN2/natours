const Review = require('./reviewModel');

const handlerFactory = require('./../global/_handlerFactory');
const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');

const setTourIdQuery = (req, res, next) => {
  if (req.params.tourId && !req.query.tour) req.query.tour = req.params.tourId;
  next();
};

// set tourId and userId as properties of req.body
const setTourUserId = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

// Prevent the same user posting multiple review for the same tour
const checkExistingReview = catchAsync(async (req, res, next) => {
  const existingReview = await Review.findOne({
    tour: req.body.tour,
    user: req.body.user
  });

  if (existingReview) {
    const error = new AppError(
      'You have already submitted a review for this tour',
      400
    );
    return next(error);
  }

  next();
});

// Only allow 'admin' or 'user who is owner of the review' tp proceed
const checkReviewOwner = catchAsync(async (req, res, next) => {
  const { role } = req.user;

  if (role === 'admin') return next();

  if (role === 'user') {
    const isReviewOwner = await Review.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!isReviewOwner) {
      const error = new AppError(
        'You do not have permission for this action',
        401
      );
      return next(error);
    }

    return next();
  }
});

const getAllReviews = handlerFactory.getAll(Review);

const getReview = handlerFactory.getOne(Review);

const createReview = handlerFactory.createOne(Review);

const deleteReview = handlerFactory.deleteOne(Review);

const updateReview = handlerFactory.updateOne(Review);

module.exports = {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserId,
  setTourIdQuery,
  checkExistingReview,
  checkReviewOwner
};
