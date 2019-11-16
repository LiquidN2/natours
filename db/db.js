const mongoose = require('mongoose');

// Configure DB
// let dbUri = process.env.DATABASE_URI.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );
// dbUri = dbUri.replace('<USERNAME>', process.env.DATABASE_USERNAME);
// dbUri = dbUri.replace('<HOST>', process.env.DATABASE_HOST);
// dbUri = dbUri.replace('<DB_NAME>', process.env.DATABASE_NAME);
const dbUri = process.env.DATABASE_URI;

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
};

// Connect to DB
// mongoose
//   .connect(dbUri, options)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error(err));

const connect = async () => {
  try {
    await mongoose.connect(dbUri, options);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error(error);
  }
};

module.exports = { connect };
