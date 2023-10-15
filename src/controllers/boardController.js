const { Op } = require("sequelize");
const { validationResult } = require("express-validator");

// Models
const { User, Board, UserBoard } = require("../models/References");

//Services
const ApiError = require("../Error/ApiError");
const boardService = require("../services/BoardSevice");
const BoardSevice = require("../services/BoardSevice");

// Methods on this class ordered by http method

/**
 * Класс, отвечает за CRUD операции с досками.
 */
class BoardController {
  //Post methods

  /**
   * Создает новую доску с описанием.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает созданную доску и сообщение о успешном создании или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не найден или произошла ошибка сервера.
   */
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

  /**
   * Прикрепляет пользователя к доске.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает информацию о доске и пользователях, прикрепленных к ней, или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не найден, доска не найдена или произошла ошибка сервера.
   */
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

  // Delete methods

  /**
   * Удаляет доску.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает сообщение об успешном удалении доски или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не имеет доступа к доске, доска не найдена или произошла ошибка сервера.
   */
  async deleteBoard(req, res, next) {
    const user = req.user;
    const boardId = req.params.id;

    if (!(await boardService.checkAccess(user.id, boardId))) {
      return next(
        ApiError.forbidden("This user does't have access to this board")
      );
    }

    const deleteRows = await Board.destroy({
      where: { id: boardId },
    });

    if (!deleteRows) {
      return next(ApiError.notFound("Board not found"));
    }

    return res.status(200).json({
      message: "Board is deleted successfull",
    });
  }

  /**
   * Открепляет пользувателей от доски.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает информацию о доске и пользователях, прикрепленных к ней, после открепления или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не имеет доступа к доске, доска не найдена, пользователь не найден, пользователь является владельцем доски или произошла ошибка сервера.
   */
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

  //Put methods

  /**
   * Обновляет информацию о доске (имя и описание).
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает информацию об обновленной доске и ее пользователях или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не имеет доступа к доске, доска не найдена, произошла ошибка валидации данных или произошла ошибка сервера.
   */
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

  //Get methods

  /**
   * Получает информацию о доске по ее идентификатору.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает информацию о доске и ее пользователях или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не имеет доступа к доске, доска не найдена или произошла ошибка сервера.
   */
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
          name: targetBoard.boardName,
        },
        users,
      });
    } catch (e) {
      return next(ApiError.internal("Some server errror"));
    }
  }

  /**
   * Получает список досок, к которым у пользователя есть доступ.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает список досок и информацию о доступе пользователя к каждой доске или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если произошла ошибка сервера.
   */
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
