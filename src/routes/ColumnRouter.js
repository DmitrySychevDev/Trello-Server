const Router = require("express");
const router = new Router();

router.get("/:id");
router.put("/:id");
router.post("/create");
router.delete("/:id");

module.exports = router;
