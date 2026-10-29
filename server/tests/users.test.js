const request = require('supertest');
const { buildTestApp } = require('./helpers');

describe('/api/users', () => {
  let ctx;
  const auth = (user) => ({ Authorization: `Bearer ${ctx.tokenFor(user)}` });

  beforeEach(async () => {
    ctx = await buildTestApp();
  });

  describe('GET /me', () => {
    it('devuelve el perfil del usuario autenticado sin datos sensibles', async () => {
      const res = await request(ctx.app).get('/api/users/me').set(auth(ctx.users.viewer));
      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({ email: 'viewer@demo.cl', role: 'viewer' }),
      );
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('tokenVersion');
    });
  });

  describe('GET /', () => {
    it('permite listar a admin y editor con paginación', async () => {
      for (const user of [ctx.users.admin, ctx.users.editor]) {
        const res = await request(ctx.app).get('/api/users?page=1&pageSize=2').set(auth(user));
        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body).toMatchObject({ page: 1, pageSize: 2, total: 3 });
      }
    });

    it('prohíbe listar a viewer', async () => {
      const res = await request(ctx.app).get('/api/users').set(auth(ctx.users.viewer));
      expect(res.status).toBe(403);
    });

    it('valida los parámetros de paginación', async () => {
      const res = await request(ctx.app).get('/api/users?pageSize=500').set(auth(ctx.users.admin));
      expect(res.status).toBe(400);
    });
  });

  describe('POST /', () => {
    const nuevo = { name: 'Nuevo', email: 'nuevo@demo.cl', password: 'Segura123', role: 'viewer' };

    it('crea usuarios si es admin', async () => {
      const res = await request(ctx.app).post('/api/users').set(auth(ctx.users.admin)).send(nuevo);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: 'nuevo@demo.cl', role: 'viewer' });
      const stored = await ctx.userRepo.findByEmail('nuevo@demo.cl');
      expect(stored.passwordHash).not.toBe(nuevo.password);
    });

    it('prohíbe crear usuarios a editor', async () => {
      const res = await request(ctx.app).post('/api/users').set(auth(ctx.users.editor)).send(nuevo);
      expect(res.status).toBe(403);
    });

    it('rechaza emails duplicados con 409', async () => {
      const res = await request(ctx.app)
        .post('/api/users')
        .set(auth(ctx.users.admin))
        .send({ ...nuevo, email: 'editor@demo.cl' });
      expect(res.status).toBe(409);
    });

    it('exige una contraseña robusta y un rol válido', async () => {
      const res = await request(ctx.app)
        .post('/api/users')
        .set(auth(ctx.users.admin))
        .send({ ...nuevo, password: 'debil', role: 'superadmin' });
      expect(res.status).toBe(400);
      expect(res.body.details.map((d) => d.field)).toEqual(
        expect.arrayContaining(['password', 'role']),
      );
    });
  });

  describe('PATCH /:id', () => {
    it('cambia el rol e invalida las sesiones del usuario', async () => {
      const { viewer } = ctx.users;
      const res = await request(ctx.app)
        .patch(`/api/users/${viewer.id}`)
        .set(auth(ctx.users.admin))
        .send({ role: 'editor' });
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('editor');
      expect((await ctx.userRepo.findById(viewer.id)).tokenVersion).toBe(1);
    });

    it('impide que el admin se quite su propio rol', async () => {
      const { admin } = ctx.users;
      const res = await request(ctx.app)
        .patch(`/api/users/${admin.id}`)
        .set(auth(admin))
        .send({ role: 'viewer' });
      expect(res.status).toBe(400);
    });

    it('responde 404 si el usuario no existe y 400 si el ID es inválido', async () => {
      const h = auth(ctx.users.admin);
      expect(
        (await request(ctx.app).patch('/api/users/999').set(h).send({ name: 'X Y' })).status,
      ).toBe(404);
      expect(
        (await request(ctx.app).patch('/api/users/abc').set(h).send({ name: 'X Y' })).status,
      ).toBe(400);
    });

    it('rechaza un body vacío', async () => {
      const res = await request(ctx.app)
        .patch(`/api/users/${ctx.users.viewer.id}`)
        .set(auth(ctx.users.admin))
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:id', () => {
    it('elimina usuarios si es admin', async () => {
      const res = await request(ctx.app)
        .delete(`/api/users/${ctx.users.viewer.id}`)
        .set(auth(ctx.users.admin));
      expect(res.status).toBe(204);
      expect(await ctx.userRepo.findById(ctx.users.viewer.id)).toBeNull();
    });

    it('impide que el admin se elimine a sí mismo', async () => {
      const res = await request(ctx.app)
        .delete(`/api/users/${ctx.users.admin.id}`)
        .set(auth(ctx.users.admin));
      expect(res.status).toBe(400);
    });

    it('prohíbe eliminar a editor', async () => {
      const res = await request(ctx.app)
        .delete(`/api/users/${ctx.users.viewer.id}`)
        .set(auth(ctx.users.editor));
      expect(res.status).toBe(403);
    });
  });

  it('responde 404 en rutas inexistentes', async () => {
    const res = await request(ctx.app).get('/api/no-existe');
    expect(res.status).toBe(404);
  });
});
