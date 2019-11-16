const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('./bookingModel');

// DB MODEL
const Tour = require('./../tour/tourModel');

// GLOBAL CONTROLLERS
const handlerFactory = require('./../global/_handlerFactory');
const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');

const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get tour
  const tour = await Tour.findById(req.params.tourId);

  const port = process.env.NODE_ENV === 'development' ? ':3000' : '';

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.host}${port}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}&startDate=${req.params.dateId}`,
    cancel_url: `${req.protocol}://${req.host}${port}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, // price in cents
        currency: 'aud',
        quantity: 1
      }
    ]
  });

  // 3. Respond with session
  res.status(200).json({
    status: 'success',
    session
  });
});

const createBookingCheckout = catchAsync(async (req, res, next) => {
  // console.log('Creating booking...');
  const { tour, user, price, startDate } = req.query;

  if (!tour || !user || !price || !startDate) return next();

  await Booking.create({ tour, user, price, startDate });
  // console.log('Booking created. Redirecting...');
  // res.redirect(req.originalUrl.split('?')[0]);
  res.redirect('/');
});

const createBooking = handlerFactory.createOne(Booking);

const deleteBooking = handlerFactory.deleteOne(Booking);

const updateBooking = handlerFactory.updateOne(Booking);

const getBooking = handlerFactory.getOne(Booking);

const getAllBookings = handlerFactory.getAll(Booking);

const tourIsBookedByUser = catchAsync(async (req, res, next) => {
  const { user, tour } = req.body;

  const booking = await Booking.find({ tour, user });

  if (booking.length === 0) {
    const error = new AppError(
      `You must book this tour to submit a review`,
      400
    );
    return next(error);
  }

  next();
});

module.exports = {
  getCheckoutSession,
  createBookingCheckout,
  createBooking,
  deleteBooking,
  updateBooking,
  getBooking,
  getAllBookings,
  tourIsBookedByUser
};
