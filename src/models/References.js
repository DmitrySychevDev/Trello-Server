const Board = require("./Board");
const Card = require("./Card");
const User = require("./User");
const Comment = require("./Comment");
const Column = require("./Column");

const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const UserBoard = sequelize.define("user_board", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

Card.hasMany(Comment);
Comment.belongsTo(Card);

User.hasMany(Comment);
Comment.belongsTo(User);

User.hasMany(Card);
Card.belongsTo(User);

Column.hasMany(Card);
Card.belongsTo(Column);

Board.hasMany(Column);
Column.belongsTo(Board);

User.belongsToMany(Board, { through: UserBoard });
Board.belongsToMany(User, { through: UserBoard });

module.exports = {
  Board,
  Card,
  User,
  Comment,
  Column,
  UserBoard,
};
