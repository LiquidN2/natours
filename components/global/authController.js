const crypto = require('crypto');
const { promisify } = require('util');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const User = require('./../user/userModel');

const catchAsync = require('./../../utils/catchAsync');
const AppError = require('./../../utils/appError');
const Email = require('./../../utils/email');

/**
 * Description. This fuction generates jwt from instance of user and send response *
 * @param {object}  user       instance of User model
 * @param {integer} statusCode response status code
 * @param {object}  res        response object of express route callback
 * @param {boolean} remember   stay signed in or not
 */
const createSendToken = async (user, statusCode, req, res, remember = true) => {
  const token = await user.generateToken();

  // if user do not want to stay signed in, create a session cookie (expires = 0)
  const expires = remember
    ? new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      )
    : 0;

  const cookieName = 'jwt';
  const cookieValue = token;
  const cookieOptions = {
    expires: expires,
    httpOnly: true,
    secure: req.secure || req.headers('x-forwarded-proto') === 'https'
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.sameSite = 'strict';
  }

  let responseBody;

  if (statusCode === 201) {
    responseBody = {
      status: 'success',
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo
      },
      token
    };
  } else {
    responseBody = {
      status: 'success',
      token
    };
  }

  res.clearCookie('email');
  res.clearCookie('remember');
  // Send JWT as cookie
  res.cookie(cookieName, cookieValue, cookieOptions);

  res.status(statusCode).json(responseBody);
};

/** -------------------------
 * ------ USER SIGN UP ------
 * -------------------------- */
const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  let emailConfirmToken = await promisify(crypto.randomBytes)(32);
  emailConfirmToken = emailConfirmToken.toString('hex');

  const hashedEmailConfirmToken = crypto
    .createHash('sha256')
    .update(emailConfirmToken)
    .digest('hex');

  // 1. Save new user in DB
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    emailConfirmToken: hashedEmailConfirmToken
  });

  // 2. Send new user welcome email
  // const url = `${req.protocol}://${req.get('host')}/me`;
  const url = `${req.protocol}://${req.get(
    'host'
  )}/email-confirm/${emailConfirmToken}`;
  const welcomeEmail = new Email(newUser, url);
  await welcomeEmail.sendWelcome();

  // 3. Send access token
  await createSendToken(newUser, 201, req, res);
});

/** -----------------------
 * ------ USER LOGIN ------
 * ------------------------ */
const login = catchAsync(async (req, res, next) => {
  const { email, password, remember } = req.body;

  // Step 1 - check if email & password exist
  if (!email || !password) {
    const error = new AppError(`Please provide both email and password`, 400);
    return next(error);
  }

  // Step 2 - check if user exists & password is correct
  // .select('+password') to explicitly select a field that is not selected by default in schema
  const user = await User.findOne({ email }).select('+password');
  const isCorrectPassword = user ? await user.comparePassword(password) : false;

  if (!user || !isCorrectPassword) {
    const error = new AppError(`Incorrect email or password`, 401);
    return next(error);
  }

  // Step 3a - if everything is ok and 2fa is not enabled, send token
  if (!user.twoFactorEnabled) {
    return await createSendToken(user, 200, req, res, remember);
  }

  // step 3b - if 2fa is enabled, instruct client to redirect
  const cookieExpiresIn = new Date(Date.now() + 15 * 60 * 1000);

  res.cookie('email', user.email, {
    expires: cookieExpiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // set to 'true' to send cookie via https in production
  });

  res.cookie('remember', remember, {
    expires: cookieExpiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // set to 'true' to send cookie via https in production
  });

  res.status(200).json({
    status: 'success',
    redirect: '/login-totp'
  });
});

/** ---------------------------------
 * ------ USER LOGIN WITH TOTP ------
 * ---------------------------------- */
const loginTotp = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  const email = req.cookies.email ? req.cookies.email : req.body.email;
  const remember = req.cookies.remember
    ? req.cookies.remember
    : req.body.remember;

  // Step 1 - check if email & code exist
  if (!email || !token) {
    const error = new AppError(`Missing login credentials`, 400);
    return next(error);
  }

  // Step 2 - check if user exists & password is correct
  // .select('+password') to explicitly select a field that is not selected by default in schema
  const user = await User.findOne({ email });

  const tokenValidated = speakeasy.totp.verify({
    secret: user.twoFactorSercret,
    encoding: 'base32',
    token: token
  });

  if (!user || !tokenValidated) {
    const error = new AppError(`Invalid login credentials`, 401);
    return next(error);
  }

  await createSendToken(user, 200, req, res, remember);
});

/** ------------------------
 * ------ USER LOGOUT ------
 * ------------------------- */
const logout = (req, res) => {
  // 1. Send loggedout cookie
  const cookieName = 'jwt';
  const cookieValue = 'loggedout';
  const cookieOptions = {
    expires: new Date(Date.now() + 10000),
    httpOnly: true
  };

  res.cookie(cookieName, cookieValue, cookieOptions);

  res.status(200).json({
    status: 'success'
  });
};

/** --------------------------------------------------
 * ------ ROUTE PROTECTION / USER AUTHENTICATON ------
 * --------------------------------------------------- */
const protect = catchAsync(async (req, res, next) => {
  // 1. Check if there's a token in authorization header or in cookie
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    const error = new AppError(
      'You are not logged in. Please login to access.',
      401
    );
    return next(error);
  }

  // 2. Validate token
  const decoded = await User.validateToken(token);

  // 3. Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    const error = new AppError('The user of this token no longer exists.', 401);
    return next(error);
  }

  // 4. Check if user has changed password after JWT was issued
  const isChangedPassword = await user.changedPasswordAfter(decoded.iat);
  if (isChangedPassword) {
    const error = new AppError(
      'User has recently changed password. Please login again',
      401
    );
    return next(error);
  }

  // If all tests pass, grant access to protected route
  res.locals.user = user;
  req.user = user;
  next();
});

/** -----------------------------------------------------
 * ------ VALIDATE LOGIN STATUS FOR PAGE RENDERING ------
 * ------------------------------------------------------ */
const isLoggedIn = async (req, res, next) => {
  // 1. Check if there's a token in authorization header or in cookie
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      // 2. Validate token
      const decoded = await User.validateToken(token);

      // 3. Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) return next();

      // 4. Check if user has changed password after JWT was issued
      const isChangedPassword = await user.changedPasswordAfter(decoded.iat);
      if (isChangedPassword) return next();

      // console.log(user);

      // If all tests pass, there is a user
      res.locals.user = user;
      req.user = user;
      return next();
    } catch (error) {
      return next();
    }
  }
  // res.redirect('/');
  next();
};

/** ---------------------------
 * ------ EMAIL PROVIDED ------
 * ---------------------------- */
const emailProvided = (req, res, next) => {
  if (req.cookies.email) return next();
  res.redirect('/');
};

/** ----------------------------------------------
 * ------ REDIRECT TO HOME IF NOT LOGGED IN ------
 * ----------------------------------------------- */
const redirectHomeIfNotLoggedIn = async (req, res, next) => {
  if (!res.locals.user) {
    return res.redirect('/');
  }
  next();
};

/** ------------------------------------------
 * ------ REDIRECT TO HOME IF LOGGED IN ------
 * ------------------------------------------- */
const redirectHomeIfLoggedIn = async (req, res, next) => {
  if (res.locals.user) {
    return res.redirect('/');
  }
  next();
};

/** ----------------------------------------------------
 * ------ ACCESS RESTRICTION / USER AUTHENTICATON ------
 * ----------------------------------------------------- */
const restrictTo = (...roles) => {
  // Must be used AFTER the PROTECT middleware where req.user is set
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new AppError(
        'You do not have permission for this action',
        403
      );
      return next(error);
    }

    next();
  };
};

/** ----------------------------
 * ------ FORGOT PASSWORD ------
 * ----------------------------- */
const forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const error = new AppError('There is no user with that email address', 404);
    return next(error);
  }

  // 2. Generate random reset token
  const resetToken = await user.generatePasswordResetToken();

  // 3. Step 2 generated passwordResetToken and passwordResetExpires. So they need to be saved
  // IMPORTANT:
  // when using 'save' method to update a few properties of the doc,
  // remove all mongoose validation before saving doc to prevent error
  await user.save({ validateBeforeSave: false });

  // 4. Send token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/reset-password/${resetToken}`;

  try {
    const passwordResetEmail = new Email(user, resetURL);
    await passwordResetEmail.sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });

    // if fail to send email
  } catch (error) {
    // delete passwordResetToken and passwordResetExpres in the DB
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    // send 500 code error to user
    const appResponseError = new AppError(
      'There was an error sending the email. Please try again later.',
      500
    );
    return next(appResponseError);
  }
});

/** ---------------------------
 * ------ RESET PASSWORD ------
 * ---------------------------- */
const resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on Token
  const user = await User.findUserByPasswordResetToken(req.params.token);

  if (!user) {
    const error = new AppError(
      'Invalid or expired token. Please try the forgot password step again',
      400
    );
    return next(error);
  }

  // 2. If token is valid and there is a user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  /* 3. Update changedPasswordAt property for the user
    This is done automatically via User document hook in model
  */

  // 4. Save all changes
  await user.save();

  // 4. Log the user in, send new JWT
  await createSendToken(user, 200, req, res);
});

/** ----------------------------
 * ------ UPDATE PASSWORD ------
 * ----------------------------- */
const updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if posted current password is correct
  const isCorrectCurrentPassword = await user.comparePassword(
    req.body.passwordCurrent
  );

  if (!isCorrectCurrentPassword) {
    const error = new AppError('Your current password is not correct', 401);
    return next(error);
  }

  // 3. Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4. Log user in (send token)
  await createSendToken(user, 200, req, res);
  // const token = await user.generateToken();

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

/** --------------------------
 * ------ CONFIRM EMAIL ------
 * --------------------------- */
const emailConfirm = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Find the user
  const user = await User.findOneAndUpdate(
    { emailConfirmToken: hashedToken },
    { emailConfirmed: true }
  );

  if (!user) {
    const error = new AppError(`Invalid token`, 400);
    return next(error);
  }

  res.status(200).json({
    status: 'success'
  });
});

/** -------------------------------------------------
 * ------ TURN ON/OFF TWO-FACTOR AUTHENTICATON ------
 * -------------------------------------------------- */
const updateTwoFactor = catchAsync(async (req, res, next) => {
  const { twoFactorEnabled } = req.body;

  if (twoFactorEnabled) {
    // Generate a secret key
    const secret = speakeasy.generateSecret();

    // Generate the URL for QRCode
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    await User.findByIdAndUpdate(req.user.id, {
      twoFactorEnabled: true,
      twoFactorSercret: secret.base32
    });

    return res.status(200).json({
      status: 'success',
      qrCodeUrl
    });
  }

  await User.findByIdAndUpdate(req.user.id, {
    twoFactorEnabled: false,
    twoFactorSercret: null
  });

  res.status(200).json({
    status: 'success'
  });
});

module.exports = {
  signup,
  login,
  loginTotp,
  emailProvided,
  logout,
  protect,
  isLoggedIn,
  redirectHomeIfNotLoggedIn,
  redirectHomeIfLoggedIn,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  emailConfirm,
  updateTwoFactor
};
