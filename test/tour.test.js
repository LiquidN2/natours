const fs = require('fs');
const request = require('supertest');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Config TEST env
require(path.resolve(ROOT_DIR, 'config/config'));

// Connect to DB
const mongoose = require(path.resolve(ROOT_DIR, 'db/mongoose'));

const app = require(path.resolve(ROOT_DIR, 'app'));

const Tour = require(path.resolve(ROOT_DIR, 'models/tourModel'));

// Read JSON file
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/seed/tours.json`, 'utf-8')
);

const tourOneId = new mongoose.Types.ObjectId();
// console.log(tourOneId);
const tourOne = {
  _id: tourOneId,
  name: 'The City Wanderer',
  duration: 9,
  maxGroupSize: 20,
  difficulty: 'easy',
  ratingsAverage: 4.6,
  ratingsQuantity: 54,
  price: 1197,
  summary: "Living the life of Wanderlust in the US' most beatiful cities",
  description:
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat lorem ipsum dolor sit amet.\nConsectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur, nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat!',
  imageCover: 'tour-4-cover.jpg',
  images: ['tour-4-1.jpg', 'tour-4-2.jpg', 'tour-4-3.jpg'],
  startDates: ['2021-03-11,10:00', '2021-05-02,10:00', '2021-06-09,10:00']
};

beforeEach(async () => {
  await Tour.deleteMany(); // wipe tour data
  await Tour.insertMany([tourOne, ...tours]); // insert seed data
});

describe('GET /api/v1/tours/test', () => {
  test('Test OK response', async () => {
    await request(app)
      .get('/api/v1/tours/test')
      .expect(200);
  });
});

describe('GET /api/v1/tours', () => {
  test('Get all tours - JSON response', async () => {
    await request(app)
      .get('/api/v1/tours')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe('POST /api/v1/tours', () => {
  test('Should not create new tour without tour name', async () => {
    const newTour = {
      duration: 3,
      maxGroupSize: 12,
      difficulty: 'easy',
      ratingsAverage: 4.9,
      ratingsQuantity: 33,
      price: 1497,
      summary:
        'Enjoy the Northern Lights in one of the best places in the world',
      description:
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum!\nDolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur, exercitation ullamco laboris nisi ut aliquip. Lorem ipsum dolor sit amet, consectetur adipisicing elit!',
      imageCover: 'tour-9-cover.jpg',
      images: ['tour-9-1.jpg', 'tour-9-2.jpg', 'tour-9-3.jpg'],
      startDates: ['2021-12-16,10:00', '2022-01-16,10:00', '2022-12-12,10:00']
    };

    await request(app)
      .post('/api/v1/tours')
      .send(newTour)
      .expect(400);
  });

  test('Create a new tour', async () => {
    const newTour = {
      name: 'Test Tour',
      duration: 3,
      maxGroupSize: 12,
      difficulty: 'easy',
      ratingsAverage: 4.9,
      ratingsQuantity: 33,
      price: 1497,
      summary:
        'Enjoy the Northern Lights in one of the best places in the world',
      description:
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum!\nDolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur, exercitation ullamco laboris nisi ut aliquip. Lorem ipsum dolor sit amet, consectetur adipisicing elit!',
      imageCover: 'tour-9-cover.jpg',
      images: ['tour-9-1.jpg', 'tour-9-2.jpg', 'tour-9-3.jpg'],
      startDates: ['2021-12-16,10:00', '2022-01-16,10:00', '2022-12-12,10:00']
    };

    // Assert correct server response
    const response = await request(app)
      .post('/api/v1/tours')
      .send(newTour)
      .expect(201);

    // Assert DB was changed correctly
    const tour = await Tour.findById(response.body.data.tour._id);
    expect(tour).not.toBeNull();

    // Assert the correct data was added
    expect(tour).toMatchObject({
      name: 'Test Tour',
      duration: 3
    });
  });
});

describe('GET /api/v1/tours/:id', () => {
  test('Get tour by id', async () => {
    await request(app)
      .get(`/api/v1/tours/${tourOneId}`)
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
