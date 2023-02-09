const jwt = require("jsonwebtoken");

const { User } = require("../models/References");

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_KEY, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
      expiresIn: "30d",
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async saveToken(userId, refreshToken) {
    const user = await User.findOne({ where: { id: userId } });
    user.refreshToken = refreshToken;
    await user.save();
  }
}

module.exports = new TokenService();
