// Models
const { User, Board, UserBoard } = require("../models/References");

//Services
const ApiError = require("../Error/ApiError");
const tokenService = require("../services/TokenService");

class BoardController {
  async createDesc(req, res, next) {
    const { name, description } = req.body;
    const { id } = req.user;

    const candidate = await User.findByPk(id);
    if (!candidate) {
      return next(ApiError.badRequest("User not found"));
    }

    const board = await Board.create({
      boardName: name,
      description: description,
    });

    try {
      await UserBoard.create({
        boardId: board.id,
        userId: candidate.id,
        accessMode: "owner",
      });
      return res.status(200).json({
        message: "Board created successfully",
        board: {
          id: board.id,
          name: board.boardName,
          description: board.description,
        },
      });
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("Some server error"));
    }
  }
}

module.exports = new BoardController();
