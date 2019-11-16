const mongoose = require('mongoose');
const Tour = require('./../tour/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'A review must not be empty']
    },

    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating must be 5.0 or less']
    },

    createdAt: {
      type: Date,
      default: Date.now()
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must be from to a user']
    },

    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must be for a tour']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// INDEXES
// prevent duplicate review from the same user for the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// MODEL METHODS
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const Review = this;

  // 1. Calculate number and average rating
  const stats = await Review.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        ratingsQuantity: { $sum: 1 },
        ratingsAverage: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);

  // 2. Update the tour
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats.length > 0 ? stats[0].ratingsAverage : 4.5,
    ratingsQuantity: stats.length > 0 ? stats[0].ratingsQuantity : 0
  });
};

/**
 * ------ DOCUMENT MIDDLEWARE/HOOK ------
 * Important Note: These hooks run before .save() or .create() methods only
 * Key word 'this' refers to the document
 */
// Calculates qty and avg rating for a tour when a new review is created
reviewSchema.post('save', async function() {
  const doc = this;
  const Model = doc.constructor;
  await Model.calcAverageRatings(doc.tour);
});

/**
 * ------ QUERY MIDDLEWARE/HOOK ------
 * Key word 'this' refers to the query
 */
// populate the user field in review
reviewSchema.pre(/^find/, function(next) {
  const query = this;
  // query.populate({
  //   path: 'user',
  //   select: 'name photo'
  // }).populate({
  //   path: 'tour',
  //   select: 'name'
  // });

  query.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// reviewSchema.post(/^find/, function(doc) {
//   const query = this;
//   console.log(query);
// });

/**
 * The .pre and .post hooks for /^findOneAnd/ work together to
 * update the ratings avg and qty everytime the a review is
 * deleted or updated via findOneAndUpdate and findOneAndDelete
 *
 * The steps are:
 * 1. ('pre' hook) Before executing the update or delete query,
 *    find the review document and save it to 'this' obj as 'this.result'.
 * 2. ('post' hook) 'this.result' gives access to the calcAverageRatings
 *    method and the tour id for updating the ratings avg and qty
 */
reviewSchema.pre(/^findOneAnd/, async function(next) {
  const query = this;
  query.result = await query.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await query.findOne() does not work here because the query has been executed
  const query = this;
  const doc = query.result;
  const Model = doc.constructor;
  await Model.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
