const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authController.js');

const upload = multer({ dest: 'public/img/users' });

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get(
  '/getMe',
  authController.protect,
  userController.getMe,
  userController.getUserById
);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.patch(
  '/updateUser',
  authController.protect,
  userController.uploadPhoto,
  userController.updateMe
);
router.delete('/deleteUser', authController.protect, userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

/* understanding patch example
  app.patch('/api/v1/tours/:id', (req, res) => {
    if (req.params.id > tours.length) {
      res.status(404).json({
        status: 'failed',
        message: 'Invalid id',
      });
    }
    res.status(200).json({
      status: 'success',
      tour: '<Updated>',
    });
  });
  */
