const router = require('express').Router();

router.get('/share-bank', (req, res) => {
  res.render('index');
});

module.exports = router;
