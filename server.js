// CONFIGURE ENV
const dotenv = process.env.NODE_ENV !== 'production' ? require('dotenv') : null;

if (dotenv) dotenv.config();

// require('./config/config');

// START LISTENING FOR UNCAUGHT EXCEPTION (should be placed at the top of the code)
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // close the server before shutting down the application
  process.exit(1);
});

// CONNECT TO DB
const db = require('./db/db');

db.connect();

const app = require('./app');

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;

// START SERVER
const server = app.listen(port, () => {
  console.log(`***** ${env.toUpperCase()} *****`);
  console.log(`✅ App running on port ${port}`);
});

// HANDLE ALL PROMISE REJECTION
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // close the server before shutting down the application
  server.close(() => process.exit(1));
});

// HANDLE SIGTERM EVENTS FROM HEROKU
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down... 👋');
  // close the server before shutting down the application
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
