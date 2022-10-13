const express = require('express');
const router = express.Router();
const basketController = require('../controllers/basket.controllers');

router.get('/share-bank/:id', basketController.shareBasket);

module.exports = router;
