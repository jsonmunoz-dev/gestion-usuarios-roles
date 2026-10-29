const jwt = require('jsonwebtoken');

function createTokenService({ accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn }) {
  return {
    signAccessToken(user) {
      return jwt.sign({ sub: String(user.id), role: user.role }, accessSecret, {
        expiresIn: accessExpiresIn,
      });
    },

    signRefreshToken(user) {
      // token_version permite revocar todos los refresh tokens de un usuario.
      return jwt.sign({ sub: String(user.id), ver: user.tokenVersion }, refreshSecret, {
        expiresIn: refreshExpiresIn,
      });
    },

    verifyAccessToken(token) {
      return jwt.verify(token, accessSecret);
    },

    verifyRefreshToken(token) {
      return jwt.verify(token, refreshSecret);
    },
  };
}

module.exports = { createTokenService };
