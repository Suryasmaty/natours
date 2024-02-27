const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController.js');
const authController = require('./../controllers/authController.js');
const reviewController = require('./../controllers/reviewController.js');
const reviewRouter = require('./reviewRoutes.js');

//router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/tour-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTourById)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

//nested Route for reviews in tour route

//POST /tour/tourId/reviews
//GET /tour/tourId/reviews
//GET /tour/tourId/reviews/reviewId

// router
//   .route('/:tourId/reviews')
//   .post(authController.protect, reviewController.createReview);

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
