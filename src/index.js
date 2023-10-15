require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const sequelize = require("./db");
const models = require("./models/References");

const errorHanling = require("./middleware/ErrorHandlingMiddleware");
const router = require("./routes/index");

const port = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);
app.use(errorHanling);


const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(port, () => {
      console.log("Server was started and connected DB");
    });
  } catch (e) {
    console.error(e);
  }
};

start();
