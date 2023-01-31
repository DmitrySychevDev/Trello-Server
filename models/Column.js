const sequelize = require("../db");
const { DataTypes } = require("sequelize");

module.exports = sequelize.define("column", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
});
