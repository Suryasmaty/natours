const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(
  cors({
    origin: '*',
  })
);

// 1)Middlewares

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limitter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from IP, try again in an hour',
});

app.use('/api', limitter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//app.use(express.static(`${__dirname}/public`));//we can use this as well instead of below
app.use(express.static(path.join(__dirname, 'public')));

//Test middleware
app.use((req, res, next) => {
  //console.log('hello from the middleware');
  //console.log(req.cookies, 'hello I am cookie');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Routes
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `cannot find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`cannot find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`cannot find ${req.originalUrl} on this server`, 404));

  //next(err);
});

//global error handling middleware
// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
//   next();
// });
app.use(globalErrorHandler);

module.exports = app;

/*
app.get('/', (req, res) => {
  res.status(200).send('Welcome to the page');
});
*/
/*
app.get('/', (req, res) => {
  res.status(200).json(
    //this will set application content = json automatically
    { message: 'Welcome to the page', app: 'natours' }
  );
});
*/

//const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));

/*
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});
*/

//refactoring above code

// 2)Route Handlers

//api calls

/*
app.get('/api/v1/tours/:id', getTourById);
app.get('/api/v1/tours/:id', getAllTours);
app.patch('/api/v1/tours/:id', updateTour);
app.post('/api/v1/tours', createTour);
app.delete('/api/v1/tours/:id', deleteTour);
*/
//alternative for above

// 3)ROUTES
