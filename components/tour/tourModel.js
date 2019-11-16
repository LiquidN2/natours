const slugify = require('slugify');
const mongoose = require('mongoose');
const { roundToDecimal } = require('./../../utils/math');

// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have 40 characters or less'],
      minlength: [10, 'Tour name must have at least 10 characters']
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: `Difficulty is either 'easy', 'medium' or 'difficult'`
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating must be 5.0 or less'],
      set: val => roundToDecimal(val, 1)
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },

    priceDiscount: {
      type: Number,
      // custom validator
      validate: {
        validator: function(val) {
          // 'this' keyword only points to current doc on NEW  document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be less than regular price'
      }
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },

    description: {
      type: String,
      trim: true
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // this field will be permanently hidden from query
    },

    // startDates: [Date],

    // startDates: [
    //   {
    //     date: Date,
    //     numParticipants: Number,
    //     soldOut: Boolean
    //   }
    // ],

    secretTour: {
      type: Boolean,
      default: false
    },

    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],

    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  // Schema Options
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// INDEXES
tourSchema.index({ slug: 1 }); //index for 'slug' in ascending order
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ startLocation: '2dsphere' });

/* VIRTUAL PROPERTIES 
 Virtual properies cannot be used in query 
 because they don't exist in DB. They are 
 generated on the fly
*/
tourSchema.virtual('durationWeek').get(function() {
  return this.duration / 7;
});

// VIRTUAL POPULATE
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// VIRTUAL POPULATE
tourSchema.virtual('startDates', {
  ref: 'StartDate',
  foreignField: 'tour',
  localField: '_id'
});

/**
 * ------ DOCUMENT MIDDLEWARE/HOOK ------
 * Important Note: These hooks run before .save() or .create() methods only
 * Key word 'this' refers to the document
 */
// Create slugified name
tourSchema.pre('save', function(next) {
  // this.slug = slugify(this.name, { lower: true });
  const doc = this;
  doc.slug = slugify(doc.name, { lower: true });
  next();
});

// Embed user info from User collection into guides
// tourSchema.pre('save', async function(next) {
//   const tour = this;
//   const guidesPromises = tour.guides.map(async id => await User.findById(id));
//   tour.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save doc.');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

/**
 * ------ QUERY MIDDLEWARE/HOOK ------
 * Key word 'this' refers to the query
 */
tourSchema.pre(/^find/, function(next) {
  const query = this;
  query.find({ secretTour: { $ne: true } });
  // this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  const query = this;
  query
    .populate({
      path: 'guides',
      select: 'name email role photo'
    })
    .populate({
      path: 'startDates'
    });
  next();
});

// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`Query took ${Date.now() - this.start} ms`);
//   console.log(docs);
//   next();
// });

/**
 * ------ AGGREGATE MIDDLEWARE/HOOK ------
 * Key word 'this' refers to the aggregation object
 */
tourSchema.pre('aggregate', function(next) {
  const aggregate = this;
  const pipeline = aggregate.pipeline();
  const noSecretTourMatch = {
    $match: {
      secretTour: { $ne: true }
    }
  };

  // if $geoNear is the first stage of the pipeline,
  // insert no secret tour matching to index 1
  // This is because $geoNear must be first
  if (pipeline[0].$geoNear) {
    pipeline.splice(1, 0, noSecretTourMatch);
    return next();
  }

  pipeline.unshift(noSecretTourMatch);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
