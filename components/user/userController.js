const multer = require('multer');
const sharp = require('sharp');
const User = require('./userModel');
const handlerFactory = require('./../global/_handlerFactory');
const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');
// const configUpload = require('./../../utils/fileUploadConfig');

// CONFIGURE IMAGE UPLOAD MIDDLEWARE
// Configure storage destination and file name
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users');
//   },
//   filename: (req, file, callback) => {
//     const fileExtension = file.mimetype.split('/')[1];
//     const fileNameWithExtension = `user-${
//       req.user.id
//     }-${Date.now()}.${fileExtension}`;
//     callback(null, fileNameWithExtension);
//   }
// });
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

// const upload = configUpload('image', 'public/img/users', 'userPhoto');

/**
 * @param {object}     obj   the object to filter
 * @param {rest_param} props these params are string name of the properties to keep
 */
const filterObject = (obj, ...propsToKeep) => {
  const filteredObj = {};

  Object.keys(obj).forEach(prop => {
    if (propsToKeep.includes(prop)) filteredObj[prop] = obj[prop];
  });

  return filteredObj;
};

const setParamsUserIdQuery = (req, res, next) => {
  if (req.params.id && !req.query.user) req.query.user = req.params.id;
  next();
};

const getAllUsers = handlerFactory.getAll(User);

const getUser = handlerFactory.getOne(User);

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup'
  });
};

const updateUser = handlerFactory.updateOne(User);

const deleteUser = handlerFactory.deleteOne(User);

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user post a password data
  if (req.body.password || req.body.passwordConfirm) {
    const error = new AppError(
      'This route is not for password updates. Please use /update-password',
      400
    );

    return next(error);
  }

  // 2. Update user doc
  const filteredBody = filterObject(req.body, 'name', 'email'); // text data
  if (req.file) filteredBody.photo = req.file.filename; // file data

  const updatedMe = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  if (!updatedMe) {
    const error = new AppError(
      'Your user doc is not found. Please register new doc.',
      404
    );

    return next(error);
  }

  res.status(200).json({
    status: 'success'
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false }, { new: true });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

const uploadUserPhoto = upload.single('photo'); // 'photo' is the field name in the form

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  // skip this middleware if there's no file
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto,
  setParamsUserIdQuery
};
