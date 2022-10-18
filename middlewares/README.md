# A Passport strategy for authenticating with a JSON Web Token.

```
Based on https://www.npmjs.com/package/passport-jwt

Usage:

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  userController.getUserDetails
);

If user is in DB, sets current mongoose user document as req.body.user
```
