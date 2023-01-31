require("dotenv").config();

const express = require("express");
const sequelize = require("./db");
const models = require("./models/References");
const cors = require("cors");

const port = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

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
