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

  verifyAccessToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_KEY);
      return userData;
    } catch (e) {
      return null;
    }
  }
  verifyRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_KEY);
      return userData;
    } catch (e) {
      return null;
    }
  }

  async findToken(token) {
    const tokenData = await User.findOne({ where: { refreshToken: token } });
    if (tokenData !== null) {
      return tokenData.refreshToken;
    } else {
      return null;
    }
  }
}

module.exports = new TokenService();
