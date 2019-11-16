const AppError = require('./../../utils/apiFeatures');
const catchAsync = require('./../../utils/catchAsync');
const APIFeatures = require('./../../utils/apiFeatures');

/** Returns the route handler which deletes one Mongoose document
 * @param   {object}    Model Mongoose model
 * @return  {function}        catchAsync function which is an Express route handler
 */
const deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      const error = new AppError(`Document ID ${req.params.id} not found`, 404);
      return next(error);
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
};

/** Returns the route handler which upadtes one Mongoose document
 * @param   {object}    Model Mongoose model
 * @return  {function}        catchAsync function which is an Express route handler
 */
const updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      const error = new AppError(`Document ID ${req.params.id} not found`, 404);
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      data: { doc }
    });
  });
};

/** Returns the route handler which creates one Mongoose document
 * @param   {object}    Model Mongoose model
 * @return  {function}        catchAsync function which is an Express route handler
 */
const createOne = Model => {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      requestAt: req.requestTime,
      data: { doc: newDoc }
    });
  });
};

/** Returns the route handler which gets one Mongoose document
 * @param   {object}    Model            Mongoose model
 * @param   {object}    popuplateOptions Mongoose model
 * @return  {function}                   catchAsync function which is an Express route handler
 */
const getOne = (Model, ...popuplateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popuplateOptions.length > 0) {
      popuplateOptions.forEach(option => {
        query = query.populate(option);
      });
    }

    const doc = await query;

    res.status(200).json({
      status: 'success',
      requestAt: req.requestTime,
      data: { doc }
    });
  });
};

/** Returns the route handler which gets all Mongoose documents
 * @param   {object}    Model            Mongoose model
 * @return  {function}                   catchAsync function which is an Express route handler
 */
const getAll = Model => {
  return catchAsync(async (req, res, next) => {
    // BUILD QUERY
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .selectFields()
      .paginate();

    const { query } = features;

    // EXECUTE QUERY
    // const docs = await features.query.explain();
    const docs = await query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestAt: req.requestTime,
      results: docs.length,
      data: { docs }
    });
  });
};

module.exports = {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll
};
