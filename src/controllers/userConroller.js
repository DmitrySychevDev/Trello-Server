// Models
const { User } = require("../models/References");

//Services
const ApiError = require("../Error/ApiError");
const mailSendServiсe = require("../services/MailSendServiсe");
const tokenService = require("../services/TokenService");

// DTOS
const UserDto = require("../dtos/UserDto");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const { validationResult } = require("express-validator");
const { where } = require("sequelize");

class UserController {
  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Invalid body"));
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email: email } });
    if (user === null) {
      return next(ApiError.notFound("User not found"));
    }

    console.log(user);

    const isPassworValid = await bcrypt.compare(password, user.password);
    if (!isPassworValid) {
      return next(ApiError.badRequest("Invalid invalid password"));
    }

    const dto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...dto });
    await tokenService.saveToken(user.id, tokens.refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(200).json({
      ...tokens,
      user: dto,
    });
  }

  async registration(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.badRequest("Invalid body"));
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
        const tokens = tokenService.generateTokens({ ...dto });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        res.cookie("refreshToken", tokens.refreshToken, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        });

        return res.status(200).json({
          ...tokens,
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
}

module.exports = new UserController();
