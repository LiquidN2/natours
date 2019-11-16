const multer = require('multer');
const AppError = require('./appError');

const configureMulter = (fileType, dest, resourceType) => {
  let errorMsg;
  let fileName;

  switch (fileType) {
    //TODO: Add more file types
    case 'image':
      errorMsg = 'Not an image! Please upload only images';
      break;

    case 'text':
      errorMsg = 'Not a text file! Please upload only text';
      break;

    default:
      errorMsg = 'Wrong file type';
  }

  // CONFIGURE IMAGE UPLOAD MIDDLEWARE
  // Configure storage destination and file name
  const multerStorage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, dest);
    },
    filename: (req, file, callback) => {
      switch (resourceType) {
        //TODO: Add more resoure types
        case 'userPhoto':
          fileName = `user-${req.user.id}-${Date.now()}`;
          break;

        default:
          fileName = Date.now();
      }

      const fileExtension = file.mimetype.split('/')[1];
      const fileNameWithExtension = `${fileName}.${fileExtension}`;
      callback(null, fileNameWithExtension);
    }
  });

  // Test for image file before uploading
  const multerFilter = (req, file, callback) => {
    if (file.mimetype.startsWith(fileType)) {
      return callback(null, true);
    }

    const error = new AppError(errorMsg, 400);
    callback(error, false);
  };

  const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

  return upload;
};

module.exports = configureMulter;
