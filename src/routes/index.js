const Router = require("express");
const router = new Router();

const userRouter = require("./UserRouter");
const cardRouter = require("./CardRouter");
const columnRouter = require("./ColumnRouter");
const boardRouter = require("./BoardRouter");

router.use("/user", userRouter);
router.use("/card", cardRouter);
router.use("/column", columnRouter);
router.use("/board", boardRouter);

module.exports = router;
