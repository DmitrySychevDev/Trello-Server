const Router = require("express");
const router = new Router();
const { body } = require("express-validator");

//Controllers
const userController = require("../controllers/userConroller");

router.post(
  "/registration",
  body("email").isEmail(),
  body("password").isLength({ min: 3, max: 32 }),
  body("name").exists().not().isEmpty(),
  userController.registration
);
router.post(
  "/login",
  body("email").isEmail(),
  body("password").isLength({ min: 3, max: 32 }),
  userController.login
);
router.get("/activate/:activationLink", userController.activate);
router.get("/refresh", userController.refresh);
module.exports = router;
