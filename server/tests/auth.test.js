const request = require('supertest');
const { buildTestApp, PASSWORD } = require('./helpers');

function getRefreshCookie(res) {
  return (res.headers['set-cookie'] || []).find((c) => c.startsWith('refresh_token='));
}

describe('POST /api/auth/login', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await buildTestApp();
  });

  it('devuelve access token, usuario sin hash y cookie httpOnly', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'admin@demo.cl', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'admin@demo.cl', role: 'admin' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const cookie = getRefreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  it('normaliza el email (mayúsculas y espacios)', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: '  ADMIN@demo.cl ', password: PASSWORD });
    expect(res.status).toBe(200);
  });

  it('responde 401 con el mismo mensaje para contraseña incorrecta y email inexistente', async () => {
    const wrongPass = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'admin@demo.cl', password: 'incorrecta' });
    const unknown = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'nadie@demo.cl', password: PASSWORD });

    expect(wrongPass.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPass.body.error).toBe(unknown.body.error);
  });

  it('rechaza a usuarios desactivados', async () => {
    await ctx.userRepo.update(ctx.users.viewer.id, { isActive: false });
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'viewer@demo.cl', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('valida el body con detalles por campo', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ email: 'no-es-email' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('responde 400 ante JSON mal formado', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
  });
});

describe('refresh y logout', () => {
  it('renueva el access token con la cookie y deja de hacerlo tras logout', async () => {
    const { app } = await buildTestApp();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'editor@demo.cl', password: PASSWORD });
    const cookie = getRefreshCookie(login);

    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(logout.status).toBe(204);

    const afterLogout = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(afterLogout.status).toBe(401);
  });

  it('responde 401 sin cookie o con cookie inválida', async () => {
    const { app } = await buildTestApp();
    expect((await request(app).post('/api/auth/refresh')).status).toBe(401);
    const res = await request(app).post('/api/auth/refresh').set('Cookie', 'refresh_token=basura');
    expect(res.status).toBe(401);
  });
});
