const sequelize = require("../db");
const { DataTypes } = require("sequelize");

module.exports = sequelize.define("boards", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  boardName: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
});
