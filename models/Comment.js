const sequelize = require("../db");
const { DataTypes } = require("sequelize");

module.exports = sequelize.define("comment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.STRING, allowNull: false },
});
