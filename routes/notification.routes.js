const express = require('express');
const router = express.Router();
const passport = require('passport');

const notificationController = require('../controllers/notification.controllers');

router.post(
  '/send_notification_cos_expr',
  passport.authenticate('jwt', { session: false }),
  notificationController.sendNotificationCosExpire,
);

module.exports = router;
