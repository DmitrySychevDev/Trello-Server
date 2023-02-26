const { Op } = require("sequelize");

// Models
const { User, Board, UserBoard } = require("../models/References");

//Services
const ApiError = require("../Error/ApiError");

class BoardService {
  async checkAccess(userId, boardId) {
    const currentUserRole = await UserBoard.findOne({
      where: {
        [Op.and]: [{ userId: userId }, { boardId: boardId }],
      },
    });
    return !(!currentUserRole || currentUserRole.accessMode !== "owner");
  }

  async getUsersFromBoard(targetBoard) {
    let users = await targetBoard.getUsers({
      through: {
        attributes: ["accessMode"],
      },
    });
    users = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      accessMode: user.user_boards.accessMode,
    }));

    return users;
  }
}

module.exports = new BoardService();
