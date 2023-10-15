const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const { validationResult } = require("express-validator");

// Models
const { User } = require("../models/References");

//Services
const ApiError = require("../Error/ApiError");
const mailSendServiсe = require("../services/MailSendServiсe");
const tokenService = require("../services/TokenService");
const userService = require("../services/UserService");

// DTOS
const UserDto = require("../dtos/UserDto");

/**
 * Класс, отвечающий за управление пользователями (аутентификация и регистрация).
 */
class UserController {
  /**
   * Аутентификация пользователя по email и паролю.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает токены доступа и информацию о пользователе или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не найден, пароль недействителен, произошла ошибка валидации данных или произошла ошибка сервера.
   */
  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email: email } });
    if (user === null) {
      return next(ApiError.notFound("User not found"));
    }

    const isPassworValid = await bcrypt.compare(password, user.password);
    if (!isPassworValid) {
      return next(ApiError.badRequest("Invalid invalid password"));
    }
    const dto = new UserDto(user);
    const tokens = await userService.generateAndsaveTokens(res, user, dto);

    return res.status(200).json({
      accessToken: tokens.accessToken,
      user: dto,
    });
  }

  /**
   * Регистрация нового пользователя.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает токены доступа и информацию о пользователе или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь с таким email уже зарегистрирован, произошла ошибка валидации данных или произошла ошибка сервера.
   */
  async registration(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(errors);
      }

      const { email, name, password } = req.body;

      const candidate = await User.findOne({ where: { email: email } });
      if (candidate !== null) {
        return next(
          ApiError.badRequest("User with this emall has already been registred")
        );
      } else {
        const code = uuid.v4();

        const hashPassword = await bcrypt.hash(password, 5);

        const user = await User.create({
          email,
          name,
          password: hashPassword,
          refreshToken: null,
          activationLink: code,
        });

        await mailSendServiсe.sendMail(
          email,
          `${process.env.API_URL}/api/user/activate/${code}`
        );

        const dto = new UserDto(user);
        const tokens = await userService.generateAndsaveTokens(res, user, dto);

        return res.status(200).json({
          accessToken: tokens.accessToken,
          user: dto,
        });
      }
    } catch (e) {
      ApiError.internal("Some unknown error");
    }
  }

  /**
   * Активация учетной записи пользователя.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Перенаправляет пользователя на клиентскую страницу после активации или возвращает ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если код активации недействителен или произошла ошибка сервера.
   */
  async activate(req, res, next) {
    try {
      const activationCode = req.params.activationLink;

      const user = await User.findOne({
        where: { activationLink: activationCode },
      });

      if (User === null) {
        return next(ApiError.notFound("Invalid link"));
      }

      user.isActivate = true;
      await user.save();

      return res.redirect(process.env.CLIENT_URL);
    } catch (e) {
      return next(ApiError.internal("Some internal error"));
    }
  }

  /**
   * Выход пользователя из системы (очищает куки).
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает успешное завершение операции выхода пользователя или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если произошла ошибка сервера.
   */
  async logout(req, res, next) {
    try {
      res.clearCookie("refreshToken");
    } catch (e) {
      return next(ApiError.internal("Some internal error"));
    }
  }

  /**
   * Обновление токена доступа с использованием токена обновления.
   * @param {import('express').Request} req - Объект запроса Express.
   * @param {import('express').Response} res - Объект ответа Express.
   * @param {import('express').NextFunction} next - Функция, вызываемая для передачи управления следующему middleware.
   * @returns {Promise<void>} Возвращает обновленный токен доступа или ошибку в случае неудачи.
   * @throws {ApiError} Возвращает ошибку ApiError, если пользователь не авторизован, токен обновления недействителен или произошла ошибка сервера.
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        next(ApiError.forbidden("User is not authorizated"));
      }

      const userData = tokenService.verifyRefreshToken(refreshToken);
      const tokenFromDb = await tokenService.findToken(refreshToken);
      if (!userData || !tokenFromDb) {
        return next(ApiError.forbidden("User is not authorizated"));
      }
      const user = await User.findByPk(userData.id);
      const dto = new UserDto(user);
      const tokens = await userService.generateAndsaveTokens(res, user, dto);

      res.status(200).json({ ...userData, accessToken: tokens.accessToken });
    } catch (e) {
      console.error(e);
      return next(ApiError.internal("some internal error"));
    }
  }
}

module.exports = new UserController();
