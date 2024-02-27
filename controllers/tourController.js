const fs = require('fs');
const Tour = require('./../model/tourModel');
const ApiFeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },

  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Upload image only', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadPhoto = upload.single('photo');

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(404).json({
      status: 'fail',
      message: 'Required fileds Missing',
    });
  }
  next();
};

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '2';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,summary,ratingsAverage,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// catchAsync(async (req, res, next) => {
//   console.log('hi', req.query);

//   const features = new ApiFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limiting()
//     .pagination();

//   const tour = await features.query.exec();

//   res.status(200).json({
//     status: 'Success',
//     data: {
//       tourLength: tour.length,
//       tourData: tour,
//     },
//   });
// });

//aggregation piperline matching and grouping
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  // Send the statistics as a response
  res.status(200).json({
    status: 'Success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);
  res.status(200).json({
    status: 'Success',
    data: {
      plan,
    },
  });
});

exports.getTourById = catchAsync(async (req, res, next) => {
  console.log(req.params);
  //const id = req.params.id * 1;
  const tour = await Tour.findById(req.params.id).populate('reviews');

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'Success',
    data: {
      tourData: tour,
    },
  });
});

exports.createTour = factory.createOne(Tour);

// catchAsync(async (req, res, next) => {
//   //fist way
//   //const newTour = new Tour({});
//   //newTour.save();

//   //second way
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

exports.updateTour = factory.updateOne;

// catchAsync(async (req, res, next) => {
//   const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body);
//   if (!updatedTour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: updatedTour,
//     },
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);

// = catchAsync(async (req, res, next) => {
//   //const id = req.params.id * 1;

//   const deletedTour = await Tour.findByIdAndDelete(req.params.id);
//   console.log(req.params.id, deletedTour);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: deletedTour,
//     },
//   });
// });
