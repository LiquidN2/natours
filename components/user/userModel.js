const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide valid email']
    },

    emailConfirmed: {
      type: Boolean,
      default: false
    },

    emailConfirmToken: String,

    photo: {
      type: String,
      default: 'default.jpg'
    },

    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },

    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false // permanently hide from query
    },

    passwordConfirm: {
      type: String,
      required: [true, 'Confirm password is required'],
      validate: {
        // This only workds on SAVE or CREATE!!!
        validator: function(val) {
          return val === this.password;
        },
        message: 'Confirm password must be the same as password'
      }
    },

    passwordChangedAt: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,

    twoFactorSercret: String,

    twoFactorEnabled: {
      type: Boolean,
      default: false
    },

    active: {
      type: Boolean,
      default: true,
      select: false
    },

    createdAt: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * @return random hex string 32 bits
 */
const createRandomString = async () => {
  const buffer = await promisify(crypto.randomBytes)(32);
  return buffer.toString('hex');
};

/**
 * Creates hashed token to be used when resetting password
 * @param  {string} token this is the token sent to customer
 * @return {string}       the hased token
 */
const createHash = string => {
  const hashedString = crypto
    .createHash('sha256')
    .update(string)
    .digest('hex');

  return hashedString;
};

// JWT TOKEN GENERATOR
userSchema.methods.generateToken = function() {
  const user = this;

  const payload = { id: user._id };
  const jwtSecret = process.env.JWT_SECRET;
  const options = { expiresIn: process.env.JWT_EXPIRES_IN };

  // convert function with callbacks to promise
  return promisify(jwt.sign)(payload, jwtSecret, options);

  // return new Promise((resolve, reject) => {
  //   jwt.sign(payload, jwtSecret, options, (err, token) => {
  //     if (err) return reject(err);
  //     resolve(token);
  //   });
  // });
};

// JWT TOKEN GENERATOR
userSchema.methods.generatePasswordResetToken = async function() {
  const user = this;

  // 1. Generate a random string (token) with size 32 bytes
  const resetToken = await createRandomString();

  // 2. Hash the random string and set as user.passwordResetToken
  user.passwordResetToken = createHash(resetToken);

  // 3. Set user.passwordResetExpires in 10 mins (token to expires in 10 minutes)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // 4. Return the token generated in step 1
  return resetToken;
};

// GENERATE TOKEN FOR EMAIL CONFIRMATION
userSchema.methods.generateEmailConfirmToken = async function() {
  const user = this;

  // 1. Generate a random string (token) with size 32 bytes
  const emailConfirmToken = await createRandomString();

  // 2. Hash the random string
  const hashedEmailConfirmToken = createHash(emailConfirmToken);

  // 3. Save the hashed token to DB
  user.emailConfirmToken = hashedEmailConfirmToken;

  return emailConfirmToken;
};

// COMPARE LOGIN PASSWORD
userSchema.methods.comparePassword = async function(candidatePassword) {
  const user = this;
  return await bcrypt.compare(candidatePassword, user.password);
};

// VERIFY IF PASSWORD WAS CHANGED AFTER JWT WAS GENERATED.
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  const user = this;
  if (user.passwordChangedAt) {
    const changedTimestamp = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// VALIDATE TOKEN FOR DATA ACCESS
userSchema.statics.validateToken = function(token) {
  const jwtSecret = process.env.JWT_SECRET;

  return promisify(jwt.verify)(token, jwtSecret);

  // return new Promise((resolve, reject) => {
  //   jwt.verify(token, jwtSecret, (err, decoded) => {
  //     if (err) return reject(err);
  //     resolve(decoded);
  //   });
  // });
};

// FIND USER BY RESET TOKEN
userSchema.statics.findUserByPasswordResetToken = async function(token) {
  const User = this;

  // 1. Create hashed token
  const hashedToken = createHash(token);

  // 2. Find user based on hashed token and token has not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  return user;
};

// DOCUMENT HOOK - ENCYRPT NEW PASSWORD (only works with save or create method)
userSchema.pre('save', async function(next) {
  const user = this;
  // only encrypt new password
  if (!user.isModified('password')) return next();

  // encrypt user password with cost of 12
  user.password = await bcrypt.hash(user.password, 12);

  // remove passwordConfirm in DB
  user.passwordConfirm = undefined;

  next();
});

// DOCUMENT HOOK - UPDATE TIMESTAMP UPON PASSWORD CHANGED (only works with save or create method)
userSchema.pre('save', function(next) {
  const user = this;

  // When password is not updated or the user is newly created, skip this step
  if (!user.isModified('password') || user.isNew) return next();

  // set the time stamp 1s earlier to ensure the token is generated after this time stamp
  // this is because MongoDB is sometimes slower
  user.passwordChangedAt = Date.now() - 1000;

  next();
});

// QUERY HOOK - Only show active users
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
