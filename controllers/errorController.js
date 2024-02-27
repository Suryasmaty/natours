const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
  console.log(value);
  const message = `duplicate field value: ${value[0]}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  return new AppError(err.message, 404);
};

const handleJWTError = (err) =>
  new AppError('Invalid token, Please login again', 401);

const handleTokenExpiredError = (err) =>
  new AppError('Your session is expired, Please login again', 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //Rendered Website
    return res.status(err.statusCode).render('error', {
      title: 'something Went Wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  //A)-API
  if (req.originalUrl.startsWith('/api')) {
    //operational trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        //error: err,
        message: err.message,
        //error: err,
        //stack: err.stack,
      });
    }
    //programming or other unknown errors:dont leak details
    else {
      //1)log error
      console.error('ERROR!', err);
      //2)Send generic message
      return res.status(500).json({
        status: 'error',
        message: 'something is very wrong',
      });
    }
  }
  //B)-rendered website
  //operational trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'something Went Wrong!',
      msg: err.message,
    });
  }
  //programming or other unknown errors:dont leak details
  else {
    //1)log error
    console.error('ERROR!', err);
    //2)Send generic message
    return res.status(err.statusCode).render('error', {
      title: 'something Went Wrong!',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    //console.log(err.name);
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    if (err.name === 'CastError')
      //err.message = `Invalid ${err.path}:${err.value}`;
      err = handleCastErrorDB(err);

    if (err.code === 11000) err = handleDuplicateFieldsDB(err);

    if (err.name === 'ValidationError') err = handleValidationError(err);

    if (err.name === 'JsonWebTokenError') err = handleJWTError(err);

    if (err.name === 'TokenExpiredError') err = handleTokenExpiredError(err);
    sendErrorProd(err, req, res);
  }
  next();
};

/*
const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //operationak error
  console.log(err.isOperational);
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      //error:err,
      message: err.message,
      error: err,
      //stack:err.stack
    });
  }
  //programming or other unknown errors:dont leak details
  else {
    //1)log error
    console.error('ERROR!', err);
    //2)Send generic message
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.log(err.name);
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    //console.log(error.name);
    //if (error.name === 'CastError') error = handleCastErrorDB(error);

    sendErrorProd(error, res);
  }
  next();
};

*/
