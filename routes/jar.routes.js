const express = require('express');
const { check, oneOf } = require('express-validator');
const passport = require('passport');
const jarController = require('../controllers/jar.controllers');

const router = express.Router();

router.get(
  '/get_owner_jars',
  passport.authenticate('jwt', { session: false }),
  jarController.getOwnerJars,
);

router.get(
  '/get_coowner_jars',
  passport.authenticate('jwt', { session: false }),
  jarController.getCoownerJars,
);

router.get(
  '/get_public_jars',
  passport.authenticate('jwt', { session: false }),
  jarController.getPublicJars,
);

router.get(
  '/get_private_jars',
  passport.authenticate('jwt', { session: false }),
  jarController.getPrivateJars,
);

router.post(
  '/create_basket',
  [
    check('name').not().isEmpty(),
    check('description').not().isEmpty(),
    check('goal').not().isEmpty(),
    //check('expirationDate').not().isEmpty(),
    check('isPublic').not().isEmpty(),
    check('image').not().isEmpty(),
  ],
  jarController.createBasket,
);

router.put(
  '/update_jar',
  [
    //passport.authenticate('jwt', { session: false }),
    oneOf([
      check('name').not().isEmpty(),
      check('goal').not().isEmpty(),
      check('expirationDate').not().isEmpty(),
      check('description').not().isEmpty(),
    ]),
  ],
  jarController.updateJar,
)

router.delete(
  '/delete_jar/:id',
  jarController.deleteJar,
)

router.get(
  '/get_jar_by_id',
  passport.authenticate('jwt', { session: false }),
  jarController.getJarById,
)

module.exports = router;
