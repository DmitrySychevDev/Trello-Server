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

class UserController {
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

  async logout(req, res, next) {
    try {
      res.clearCookie("refreshToken");
    } catch (e) {
      return next(ApiError.internal("Some internal error"));
    }
  }

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
