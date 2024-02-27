const express = require('express');

const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController.js');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('user'), //checking if logged in user is of role user or not
    reviewController.setUserIDandTourId,
    reviewController.createReview
  )
  .get(reviewController.getAllReviews);

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
