const tokenService = require("./TokenService");

class UserService {
  async generateAndsaveTokens(res, user, dto) {
    const tokens = tokenService.generateTokens({ ...dto });
    await tokenService.saveToken(user.id, tokens.refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return tokens;
  }
}

module.exports = new UserService();
