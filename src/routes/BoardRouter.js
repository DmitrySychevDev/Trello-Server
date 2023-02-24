const Router = require("express");
const router = new Router();
const boardController = require("../controllers/boardController");
const checkToken = require("../middleware/TokenMiddleware");

router.get("/:id");
router.put("/:id");
router.post("/create", checkToken, boardController.createDesc);
router.delete("/:id");

module.exports = router;
