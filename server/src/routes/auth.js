const express = require('express');
const bcrypt = require('bcryptjs');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { loginSchema } = require('../schemas');
const { publicUser } = require('../serializers');
const { unauthorized } = require('../errors');

const REFRESH_COOKIE = 'refresh_token';

function authRouter({ userRepo, tokenService, config }) {
  const router = express.Router();

  const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  function issueTokens(res, user) {
    res.cookie(REFRESH_COOKIE, tokenService.signRefreshToken(user), cookieOptions);
    return tokenService.signAccessToken(user);
  }

  router.post('/login', validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const user = await userRepo.findByEmail(email);
    // Mismo mensaje para email inexistente o contraseña incorrecta (evita enumeración).
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!valid || !user.isActive) {
      throw unauthorized('Credenciales inválidas');
    }
    const accessToken = issueTokens(res, user);
    res.json({ accessToken, user: publicUser(user) });
  });

  router.post('/refresh', async (req, res) => {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) throw unauthorized();

    let payload;
    try {
      payload = tokenService.verifyRefreshToken(token);
    } catch {
      throw unauthorized('Sesión expirada');
    }

    const user = await userRepo.findById(Number(payload.sub));
    if (!user || !user.isActive || user.tokenVersion !== payload.ver) {
      throw unauthorized('Sesión revocada');
    }
    const accessToken = issueTokens(res, user);
    res.json({ accessToken, user: publicUser(user) });
  });

  router.post('/logout', authenticate(tokenService), async (req, res) => {
    await userRepo.incrementTokenVersion(req.user.id);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    res.status(204).end();
  });

  return router;
}

module.exports = { authRouter };
