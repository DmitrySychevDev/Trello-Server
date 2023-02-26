const Router = require("express");
const { body } = require("express-validator");
const router = new Router();

//Controllers
const boardController = require("../controllers/boardController");

//Midlewares
const checkToken = require("../middleware/TokenMiddleware");

router.get("/:id");
router.put("/:id");
router.post(
  "/create",
  checkToken,
  body("name").exists().withMessage("name is requered"),
  body("description").exists().withMessage("description is requered"),
  boardController.createDesc
);
router.post(
  "/atach/:id",
  checkToken,
  body("collaboratorId").exists().isNumeric(),
  boardController.atachCollaborators
);
router.delete("/:id");

module.exports = router;
