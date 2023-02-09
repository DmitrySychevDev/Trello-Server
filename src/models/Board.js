const sequelize = require("../db");
const { DataTypes } = require("sequelize");

module.exports = sequelize.define("board", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  boardName: { type: DataTypes.STRING, allowNull: false },
});
