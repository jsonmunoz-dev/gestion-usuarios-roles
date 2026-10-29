const request = require('supertest');
const { buildTestApp, config } = require('./helpers');
const { createApp } = require('../src/app');

describe('modo demo', () => {
  async function demoApp(overrides = {}) {
    const ctx = await buildTestApp();
    const resetDemo = jest.fn().mockResolvedValue();
    const demoConfig = { ...config, demoMode: true, cronSecret: 'secreto-cron', ...overrides };
    const app = createApp({
      userRepo: ctx.userRepo,
      tokenService: ctx.tokenService,
      config: demoConfig,
      resetDemo,
    });
    return { ...ctx, app, resetDemo };
  }

  it('protege las cuentas de ejemplo de cambios y eliminación', async () => {
    const { app, users, tokenFor } = await demoApp();
    const auth = { Authorization: `Bearer ${tokenFor(users.admin)}` };

    const patch = await request(app)
      .patch(`/api/users/${users.editor.id}`)
      .set(auth)
      .send({ role: 'viewer' });
    expect(patch.status).toBe(409);
    expect(patch.body.error).toMatch(/demostración/);

    const del = await request(app).delete(`/api/users/${users.viewer.id}`).set(auth);
    expect(del.status).toBe(409);
  });

  it('permite modificar usuarios creados por los visitantes', async () => {
    const { app, users, tokenFor } = await demoApp();
    const auth = { Authorization: `Bearer ${tokenFor(users.admin)}` };
    const created = await request(app)
      .post('/api/users')
      .set(auth)
      .send({ name: 'Visitante', email: 'visita@demo.cl', password: 'Segura123', role: 'viewer' });
    expect(
      (await request(app).patch(`/api/users/${created.body.id}`).set(auth).send({ role: 'editor' }))
        .status,
    ).toBe(200);
    expect((await request(app).delete(`/api/users/${created.body.id}`).set(auth)).status).toBe(204);
  });

  it('fuera del modo demo las cuentas de ejemplo se pueden editar', async () => {
    const { app, users, tokenFor } = await buildTestApp();
    const res = await request(app)
      .patch(`/api/users/${users.editor.id}`)
      .set({ Authorization: `Bearer ${tokenFor(users.admin)}` })
      .send({ role: 'viewer' });
    expect(res.status).toBe(200);
  });

  describe('GET /api/demo/reset', () => {
    it('reinicia los datos con el secreto correcto', async () => {
      const { app, resetDemo } = await demoApp();
      const res = await request(app)
        .get('/api/demo/reset')
        .set('Authorization', 'Bearer secreto-cron');
      expect(res.status).toBe(200);
      expect(resetDemo).toHaveBeenCalledTimes(1);
    });

    it('responde 401 sin el secreto o con uno incorrecto', async () => {
      const { app, resetDemo } = await demoApp();
      expect((await request(app).get('/api/demo/reset')).status).toBe(401);
      expect(
        (await request(app).get('/api/demo/reset').set('Authorization', 'Bearer otro')).status,
      ).toBe(401);
      expect(resetDemo).not.toHaveBeenCalled();
    });

    it('no existe si el modo demo está desactivado o falta el secreto', async () => {
      for (const overrides of [{ demoMode: false }, { cronSecret: undefined }]) {
        const { app } = await demoApp(overrides);
        const res = await request(app)
          .get('/api/demo/reset')
          .set('Authorization', 'Bearer secreto-cron');
        expect(res.status).toBe(404);
      }
    });
  });
});
