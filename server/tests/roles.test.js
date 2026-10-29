const express = require('express');
const request = require('supertest');
const { authenticate, requireRole } = require('../src/middleware/auth');
const { errorHandler } = require('../src/middleware/errorHandler');
const { createTokenService } = require('../src/services/tokenService');
const { config } = require('./helpers');

const tokenService = createTokenService(config.jwt);

function appWith(...roles) {
  const app = express();
  app.get('/privado', authenticate(tokenService), requireRole(...roles), (_req, res) =>
    res.json({ ok: true }),
  );
  app.use(errorHandler);
  return app;
}

const tokenFor = (role) => tokenService.signAccessToken({ id: 1, role });

describe('middleware de autenticación y roles', () => {
  it('responde 401 sin header Authorization', async () => {
    const res = await request(appWith('admin')).get('/privado');
    expect(res.status).toBe(401);
  });

  it('responde 401 con un token firmado con otro secreto', async () => {
    const other = createTokenService({ ...config.jwt, accessSecret: 'otro' });
    const res = await request(appWith('admin'))
      .get('/privado')
      .set('Authorization', `Bearer ${other.signAccessToken({ id: 1, role: 'admin' })}`);
    expect(res.status).toBe(401);
  });

  it('responde 401 con un token expirado', async () => {
    const expired = createTokenService({ ...config.jwt, accessExpiresIn: -10 });
    const res = await request(appWith('admin'))
      .get('/privado')
      .set('Authorization', `Bearer ${expired.signAccessToken({ id: 1, role: 'admin' })}`);
    expect(res.status).toBe(401);
  });

  it.each([
    [['admin'], 'admin', 200],
    [['admin'], 'editor', 403],
    [['admin', 'editor'], 'editor', 200],
    [['admin', 'editor'], 'viewer', 403],
  ])('roles permitidos %j con rol %s → %i', async (allowed, role, status) => {
    const res = await request(appWith(...allowed))
      .get('/privado')
      .set('Authorization', `Bearer ${tokenFor(role)}`);
    expect(res.status).toBe(status);
  });
});
