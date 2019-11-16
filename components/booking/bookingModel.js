const mongoose = require('mongoose');

const Tour = require('../tour/tourModel');
const StartDate = require('../startDate/startDateModel');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A booking must be from to a user']
  },

  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'A booking must be for a tour']
  },

  startDate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StartDate',
    required: [true, 'A booking requires a start date']
  },

  createdAt: {
    type: Date,
    default: Date.now()
  },

  price: {
    type: Number,
    required: [true, 'A booking must have a price']
  },

  paid: {
    type: Boolean,
    default: true
  }
});

/**
 * ------ DOCUMENT MIDDLEWARE/HOOK ------
 * Key word 'this' refers to the document
 */
bookingSchema.post('save', async function(doc) {
  // 1. Update participant number
  const tour = await Tour.findById(doc.tour);
  const startDate = await StartDate.findById(doc.startDate);
  if (startDate.numParticipants < tour.maxGroupSize) {
    startDate.numParticipants += 1;
    await startDate.save();
  } else if (startDate.numParticipants >= tour.maxGroupSize) {
    startDate.soldOut = true;
    await startDate.save();
  }
});

/**
 * ------ QUERY MIDDLEWARE/HOOK ------
 * Key word 'this' refers to the query
 */
bookingSchema.pre(/^find/, function(next) {
  const query = this;

  query
    .populate({
      path: 'user',
      select: 'name email'
    })
    .populate({
      path: 'tour',
      select: 'name'
    });

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
