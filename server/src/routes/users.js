const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserSchema, paginationSchema } = require('../schemas');
const { publicUser } = require('../serializers');
const { badRequest, conflict, notFound } = require('../errors');

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('ID inválido');
  return id;
}

function usersRouter({ userRepo, tokenService }) {
  const router = express.Router();
  router.use(authenticate(tokenService));

  // Perfil propio: cualquier usuario autenticado.
  router.get('/me', async (req, res) => {
    const user = await userRepo.findById(req.user.id);
    if (!user) throw notFound('Usuario no encontrado');
    res.json(publicUser(user));
  });

  router.get(
    '/',
    requireRole('admin', 'editor'),
    validate(paginationSchema, 'query'),
    async (req, res) => {
      const { page, pageSize } = req.validatedQuery;
      const { items, total } = await userRepo.list({
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      res.json({ items: items.map(publicUser), page, pageSize, total });
    },
  );

  router.post('/', requireRole('admin'), validate(createUserSchema), async (req, res) => {
    const { name, email, password, role } = req.body;
    if (await userRepo.findByEmail(email)) {
      throw conflict('Ya existe un usuario con ese email');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepo.create({ name, email, passwordHash, role });
    res.status(201).json(publicUser(user));
  });

  router.patch('/:id', requireRole('admin'), validate(updateUserSchema), async (req, res) => {
    const id = parseId(req.params.id);
    // Un admin no puede quitarse su propio rol ni desactivarse (evita quedar sin admins).
    if (id === req.user.id && (req.body.role || req.body.isActive === false)) {
      throw badRequest('No puedes cambiar tu propio rol ni desactivar tu cuenta');
    }
    const user = await userRepo.update(id, req.body);
    if (!user) throw notFound('Usuario no encontrado');
    if (req.body.role || req.body.isActive === false) {
      // Fuerza a que el usuario vuelva a iniciar sesión con sus nuevos permisos.
      await userRepo.incrementTokenVersion(id);
    }
    res.json(publicUser(user));
  });

  router.delete('/:id', requireRole('admin'), async (req, res) => {
    const id = parseId(req.params.id);
    if (id === req.user.id) throw badRequest('No puedes eliminar tu propia cuenta');
    const deleted = await userRepo.remove(id);
    if (!deleted) throw notFound('Usuario no encontrado');
    res.status(204).end();
  });

  return router;
}

module.exports = { usersRouter };
