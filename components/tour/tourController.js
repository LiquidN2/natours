const multer = require('multer');
const sharp = require('sharp');
// const { promisify } = require('util');

const Tour = require('./tourModel');
// require('../startDate/startDateModel');

const handlerFactory = require('./../global/_handlerFactory');
const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');

// CONFIGURE IMAGE UPLOAD MIDDLEWARE
// Saving image as buffer in memory for easy image processing
const multerStorage = multer.memoryStorage();

// Test for image file before uploading
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    return callback(null, true);
  }
  const error = new AppError('Not an image! Please upload only images', 400);
  callback(error, false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1
  },
  {
    name: 'images',
    maxCount: 3
  }
]);

// upload.single('imageCover');
// upload.array('images', 3)

const resizeTourImages = catchAsync(async (req, res, next) => {
  // skip this middleware if there's no file
  if (!req.files.imageCover && !req.files.images) return next();

  // resize cover image if there's one
  if (req.files.imageCover) {
    const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    req.body.imageCover = imageCoverFilename;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${imageCoverFilename}`);
  }

  // resize other images
  if (req.files.images) {
    const { images } = req.files;
    req.body.images = [];

    const promises = images.map(async (image, i) => {
      const imageFilename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      req.body.images.push(imageFilename);

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageFilename}`);
    });

    await Promise.all(promises);
  }

  next();
});

const setParamsTourIdQuery = (req, res, next) => {
  if (req.params.id && !req.query.tour) req.query.tour = req.params.id;
  next();
};

const aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: null,
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // stage can be repeated
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  /* Query to get top 5 busiest months in a year with data
   * on number of tours, name of tours and group by month
   */
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      // Stage 1 - split document into separate docs with startDates
      {
        $unwind: '$startDates'
      },

      // Stage 2 - filter startDates
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },

      // Stage 3 - group by month, number of tours and tour name
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' }
        }
      },

      // Stage 4 - add a new "month" field
      {
        $addFields: { month: '$_id' }
      },

      // Stage 5 - hide the "_id" field
      {
        $project: { _id: 0 }
      },

      // Stage 6 - sort by number of tours in descending order
      {
        $sort: { numTourStarts: -1 }
      },

      // Stage 7 - get the top 5 tours
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      status: 'success',
      num: plan.length,
      data: { plan }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      error
    });
  }
});

const getAllTours = handlerFactory.getAll(Tour);

const getTour = handlerFactory.getOne(
  Tour,
  { path: 'reviews' },
  { path: 'startDates' }
);

const createTour = handlerFactory.createOne(Tour);

const updateTour = handlerFactory.updateOne(Tour);

const deleteTour = handlerFactory.deleteOne(Tour);

// @route GET /within-distance/:distance/center/:latlng/unit/:unit
// @route GET /within-distance/233/center/-33.8661245,151.2076453/unit/mi
const getTourWitin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const earthRadius = unit === 'mi' ? 3963.2 : 6378.1; // Earth radius in miles or km
  const radius = distance / earthRadius;

  let error;
  if (!lat || !lng) {
    error = new AppError(
      'Please provide latitude and longitude in the format lat,lng',
      400
    );
    return next(error);
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  // console.log(distance, lat, lng, unit);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours }
  });
});

// @route GET /distances/:latlng/unit/:unit
// @route GET /distances/-33.8661245,151.2076453/unit/mi
const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  let error;
  if (!lat || !lng) {
    error = new AppError(
      'Please provide latitude and longitude in the format lat,lng',
      400
    );
    return next(error);
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier // convert meters to km
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    },
    {
      $sort: { distance: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: { tours: distances }
  });
});

module.exports = {
  setParamsTourIdQuery,
  aliasTopTours,
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getTourWitin,
  getDistances,
  uploadTourImages,
  resizeTourImages
};
