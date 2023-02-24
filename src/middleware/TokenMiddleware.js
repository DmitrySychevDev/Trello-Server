const ApiError = require("../Error/ApiError");
const tokenService = require("../services/TokenService");
const { User } = require("../models/References");

module.exports = async function (req, res, next) {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return next(ApiError.forbidden("User is nor authorizated"));
    }
    const accessToken = token.split(" ")[1];
    if (!accessToken) {
      return next(ApiError.forbidden("User is nor authorizated"));
    }

    const userData = tokenService.verifyAccessToken(accessToken);
    if (!userData) {
      return next(ApiError.forbidden("User is nor authorizated"));
    }

    const candidate = await User.findByPk(userData.id);
    if (!candidate) {
      return next(ApiError.forbidden("User is nor authorizated"));
    }

    req.user = userData;
    next();
  } catch (e) {
    return next(ApiError.forbidden("User is nor authorizated"));
  }
};
