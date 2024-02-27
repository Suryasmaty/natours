const { promisify } = require('util');
const User = require('./../model/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  //console.log(newUser._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);

  await createSendToken(newUser, 200, res);
  /*
  const token = await signToken(newUser._id);
  //console.log(token);

  res.status(201).json({
    status: 'success',
    token,
    data: newUser,
  });
  */
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body; //es6 destructuring way

  //1)check if email and password exists

  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  //2)check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  //console.log(user);

  //const correct = await user.correctPassword(password, user.password);
  //console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('password or email is incorrect', 401));
  }

  //3)if everything is ok, send token to client
  await createSendToken(user, 201, res);
  /*
  const token = await signToken(user._id);
  res.status(201).json({
    status: 'success',
    token: token,
  });
  */
};

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'logging out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1)Getting token and check if it is there
  //console.log(req.headers);
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in, please login to get acess', 401)
    );
  }

  //2)Verification Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);
  //3)check if user still exists
  const freshUser = await User.findById(decoded.id);
  //console.log(freshUser);
  if (!freshUser) {
    return next(new AppError('The tokens owner is no longer exists', 401));
  }

  //4)check if user changed password after token was issued
  console.log('authcontroller', freshUser.changedPasswordAfter(decoded.iat));
  if (await freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User Recently changed password, Please login again', 401)
    );
  }

  req.user = freshUser;
  res.locals.user = freshUser;

  next();
});

//removing catchasync because that will throw error while logging out. watch video 192
exports.isLoggedIn = async (req, res, next) => {
  //1)Getting token and check if it is there
  let token;
  if (req.cookies.jwt) {
    //2)Verification Token
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3)check if user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }

      //4)check if user changed password after token was issued
      if (await freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // Set user in res.locals
      res.locals.user = freshUser;
    } catch (err) {
      // If token is invalid or expired, move to the next middleware
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There i no user with that email address', 404));
  }

  //generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password?Submit a patch request with your 
  new password and passwordConfirm to ${resetURL}.\n
  if you dont forget your password please ignore. Thank you`;
  // await sendEmail({
  //   email: user.email,
  //   subject: 'Your password reset token valid for 10 mins',
  //   message,
  // });

  res.status(200).json({
    status: 'success',
    message: 'Reset URL sent to email',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)Get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2)If user found and token not expired, set the password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined; //to remove this field for that user
  user.passwordResetExpires = undefined;
  await user.save();

  //3)Update changePasswordAt property for the user

  //4)log the user in, send JWT
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    mesage: 'Password changed successully',
    token,
  });
  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection
  const user = await User.findById(req.user._id).select('+password'); //req.user coming from protect method

  //2)Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('current password is incorrect, try again', 401));
  }

  //3)if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4)login user, send JWT
  await createSendToken(user, 200, res);
});
