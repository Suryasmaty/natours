const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const authcontroller = require('./../controllers/authController');

router.get('/me', authcontroller.protect, viewsController.getAccount);

router.post(
  '/submit-user-data',
  authcontroller.protect,
  viewsController.updateUserData
);

router.use(authcontroller.isLoggedIn);

router.get('/', viewsController.getOverview);

router.get('/overview', viewsController.getOverview);

router.get('/tour/:slug', viewsController.getTour);

router.get('/login', viewsController.getLoginForm);

module.exports = router;
