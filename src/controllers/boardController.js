const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Models
const { User, Board, UserBoard } = require("../models/References");

//Services
const ApiError = require("../Error/ApiError");
const boardService = require("../services/BoardSevice");

class BoardController {
  async createDesc(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

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

  async atachCollaborators(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }
      const user = req.user;
      const { collaboratorId } = req.body;
      const boardId = req.params.id;

      const candidate = await User.findByPk(collaboratorId);
      if (!candidate) {
        return next(ApiError.notFound("User with this id not found"));
      }

      const targetBoard = await Board.findByPk(boardId);
      if (!targetBoard) {
        return next(ApiError.notFound("Board with this id not found"));
      }

      if (!(await boardService.checkAccess(user.id, boardId))) {
        return next(
          ApiError.forbidden("This user does't have access to this board")
        );
      }

      const userBoardLog = await UserBoard.findOne({
        where: {
          [Op.and]: [{ userId: collaboratorId }, { boardId: boardId }],
        },
      });
      if (userBoardLog) {
        return next(ApiError.badRequest("User already atached"));
      }

      await UserBoard.create({
        boardId: boardId,
        userId: collaboratorId,
        accessMode: "collaborator",
      });

      const users = await boardService.getUsersFromBoard(targetBoard);
      return res
        .status(200)
        .json({ message: "User was atached by desc", users });
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("Some server errror"));
    }
  }

  async unatachCollaborators(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array });
      }
      const user = req.user;
      const { collaboratorId } = req.body;
      const boardId = req.params.id;

      const candidate = await User.findByPk(collaboratorId);
      if (!candidate) {
        return next(ApiError.notFound("User with this id not found"));
      }

      const targetBoard = await Board.findByPk(boardId);
      if (!targetBoard) {
        return next(ApiError.notFound("Board with this id not found"));
      }

      const currentUserRole = await UserBoard.findOne({
        where: {
          [Op.and]: [{ userId: user.id }, { boardId: boardId }],
        },
      });

      if (!currentUserRole || currentUserRole.accessMode !== "owner") {
        return next(
          ApiError.forbidden("This user does't have access to this board")
        );
      }

      const userBoardLog = await UserBoard.findOne({
        where: {
          [Op.and]: [{ userId: collaboratorId }, { boardId: boardId }],
        },
      });
      if (userBoardLog) {
        return next(ApiError.badRequest("User already atached"));
      }

      await UserBoard.create({
        boardId: boardId,
        userId: collaboratorId,
        accessMode: "collaborator",
      });

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
      return res
        .status(200)
        .json({ message: "User was atached by desc", users });
    } catch (e) {
      return next(ApiError.internal("Some server errror"));
    }
  }
}

module.exports = new BoardController();
