const router = require('express').Router();

router.get('/share-bank/:id', (req, res) => {
  res.render('index');
});

module.exports = router;
