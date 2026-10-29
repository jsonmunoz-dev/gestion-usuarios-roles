const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { createTokenService } = require('../src/services/tokenService');

const config = {
  clientOrigin: 'http://localhost:5173',
  isProduction: false,
  jwt: {
    accessSecret: 'test-access-secret',
    refreshSecret: 'test-refresh-secret',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
};

const PASSWORD = 'Demo1234!';
// Hash calculado una sola vez (cost bajo) para que los tests sean rápidos.
const passwordHash = bcrypt.hashSync(PASSWORD, 4);

// Repositorio en memoria con la misma interfaz que el de PostgreSQL.
function createInMemoryUserRepo() {
  let nextId = 1;
  const users = new Map();

  const repo = {
    async findByEmail(email) {
      return [...users.values()].find((u) => u.email === email) || null;
    },
    async findById(id) {
      return users.get(id) || null;
    },
    async list({ limit = 20, offset = 0 } = {}) {
      const all = [...users.values()];
      return { items: all.slice(offset, offset + limit), total: all.length };
    },
    async create({ name, email, passwordHash: hash, role }) {
      const user = {
        id: nextId++,
        name,
        email,
        passwordHash: hash,
        role,
        isActive: true,
        tokenVersion: 0,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      users.set(user.id, user);
      return user;
    },
    async update(id, changes) {
      const user = users.get(id);
      if (!user) return null;
      Object.assign(
        user,
        Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined)),
      );
      return user;
    },
    async remove(id) {
      return users.delete(id);
    },
    async incrementTokenVersion(id) {
      users.get(id).tokenVersion += 1;
    },
  };
  return repo;
}

async function buildTestApp() {
  const userRepo = createInMemoryUserRepo();
  const tokenService = createTokenService(config.jwt);
  const admin = await userRepo.create({
    name: 'Admin',
    email: 'admin@demo.cl',
    passwordHash,
    role: 'admin',
  });
  const editor = await userRepo.create({
    name: 'Editor',
    email: 'editor@demo.cl',
    passwordHash,
    role: 'editor',
  });
  const viewer = await userRepo.create({
    name: 'Viewer',
    email: 'viewer@demo.cl',
    passwordHash,
    role: 'viewer',
  });
  const app = createApp({ userRepo, tokenService, config });
  const tokenFor = (user) => tokenService.signAccessToken(user);
  return { app, userRepo, tokenService, users: { admin, editor, viewer }, tokenFor };
}

module.exports = { buildTestApp, PASSWORD, config };
