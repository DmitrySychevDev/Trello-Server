const { Op } = require("sequelize");
const { validationResult } = require("express-validator");

// Models
const { User, Board, UserBoard } = require("../models/References");

//Services
const ApiError = require("../Error/ApiError");
const boardService = require("../services/BoardSevice");
const BoardSevice = require("../services/BoardSevice");

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

      return res.status(200).json({
        message: "User was atached by desc",
        board: {
          id: targetBoard.id,
          description: targetBoard.description,
          name: targetBoard.name,
        },
        users,
      });
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("Some server errror"));
    }
  }

  async unatachCollaborators(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const user = req.user;
      const { collaboratorId } = req.body;
      const boardId = req.params.id;

      const targetBoard = await Board.findByPk(boardId);
      if (!targetBoard) {
        return next(ApiError.notFound("Board with this id not found"));
      }

      if (!(await boardService.checkAccess(user.id, boardId))) {
        return next(
          ApiError.forbidden("This user does't have access to this board")
        );
      }

      if (user.id === collaboratorId) {
        return next(ApiError.badRequest("You can't unatach owner from desc"));
      }

      const candidate = await User.findByPk(collaboratorId);
      if (!candidate) {
        return next(ApiError.notFound("User with this id not found"));
      }

      const nums = await UserBoard.destroy({
        where: {
          [Op.and]: [{ userId: collaboratorId }, { boardId: boardId }],
        },
      });
      if (!nums) {
        return next(ApiError.badRequest("User is not atached"));
      }

      const users = await boardService.getUsersFromBoard(targetBoard);
      return res.status(200).json({
        message: "User was unatached by desc",
        board: {
          id: targetBoard.id,
          description: targetBoard.description,
          name: targetBoard.name,
        },
        users,
      });
    } catch (e) {
      return next(ApiError.internal("Some server errror"));
    }
  }
  async updateBoard(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const user = req.user;
      const boardId = req.params.id;
      const { name, description } = req.body;

      if (!(await boardService.checkAccess(user.id, boardId))) {
        return next(
          ApiError.forbidden("This user does't have access to this board")
        );
      }

      const targetBoard = await Board.findByPk(boardId);
      if (!targetBoard) {
        return next(ApiError.notFound("Board is not found"));
      }
      const users = await BoardSevice.getUsersFromBoard(targetBoard);

      targetBoard.boardName = name;
      targetBoard.description = description;

      await targetBoard.save();

      return res.status(200).json({
        message: "User was unatached by desc",
        board: {
          id: targetBoard.id,
          description: targetBoard.description,
          name: targetBoard.name,
        },
        users,
      });
    } catch (e) {
      return next(ApiError.internal("Some server errror"));
    }
  }

  async getBoardById(req, res, next) {
    try {
      const user = req.user;
      const boardId = req.params.id;

      const targetBoard = await Board.findByPk(boardId);
      if (!targetBoard) {
        return next(ApiError.notFound("Board is not found"));
      }

      const userBoardLog = await UserBoard.findOne({
        where: {
          [Op.and]: [{ userId: user.id }, { boardId: boardId }],
        },
      });

      if (!userBoardLog) {
        return next(
          ApiError.forbidden("This user does't have access to this board")
        );
      }

      const users = await boardService.getUsersFromBoard(targetBoard);
      return res.status(200).json({
        board: {
          id: targetBoard.id,
          description: targetBoard.description,
          name: targetBoard.name,
        },
        users,
      });
    } catch (e) {
      return next(ApiError.internal("Some server errror"));
    }
  }

  async getBoards(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id);

      let boards = await user.getBoards({
        through: {
          attributes: ["accessMode"],
        },
      });

      boards = boards.map((board) => {
        return {
          id: board.id,
          name: board.boardName,
          description: board.description,
          accessMode: board.user_boards.accessMode,
        };
      });

      if (!boards) {
        return next(ApiError.notFound("boards not found"));
      }
      return res.status(200).json({
        boards,
      });
    } catch (e) {
      return next(ApiError.internal("Some server errror"));
    }
  }
}

module.exports = new BoardController();
