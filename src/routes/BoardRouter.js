const Router = require("express");
const { body } = require("express-validator");
const router = new Router();

//Controllers
const boardController = require("../controllers/boardController");

//Midlewares
const checkToken = require("../middleware/TokenMiddleware");

router.get("/:id", checkToken, boardController.getBoardById);

router.get("/", checkToken, boardController.getBoards);

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
router.delete(
  "/unatach/:id",
  checkToken,
  body("collaboratorId").exists().isNumeric(),
  boardController.unatachCollaborators
);

router.put(
  "/update/:id",
  checkToken,
  body("name").exists().withMessage("name is requered"),
  body("description").exists().withMessage("description is requered"),
  boardController.updateBoard
);

module.exports = router;
