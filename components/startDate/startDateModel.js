const mongoose = require('mongoose');

const startDateSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Start Date must be for a tour'],
    ref: 'Tour'
  },

  date: {
    type: Date,
    required: [true, 'Start Date must be have a date']
  },

  numParticipants: {
    type: Number,
    required: [true, 'Start Date must have a number of participants'],
    default: 0
  },

  soldOut: {
    type: Boolean,
    default: false
  }
});

const StartDate = mongoose.model('StartDate', startDateSchema);

module.exports = StartDate;
