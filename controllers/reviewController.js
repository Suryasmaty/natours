const Review = require('./../model/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setUserIDandTourId = catchAsync(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id; //from protect middelware
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
});

exports.getAllReviews = factory.getAll(Review);

exports.getReviewById = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);

/*
######################getAllReviews#####################
// catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const review = await Review.find(filter);

//   res.status(200).json({
//     status: 'Success',
//     data: review,
//   });
// });

########################CreateReview######################
// catchAsync(async (req, res, next) => {
//   if (!req.body.user) req.body.user = req.user.id; //from protect middelware
//   if (!req.body.tour) req.body.tour = req.params.tourId;

//   const review = await Review.create(req.body);

//   res.status(201).json({
//     status: 'Successfully created',
//     data: review,
//   });
// });
*/
