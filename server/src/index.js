// Punto de entrada que usa Vercel: exporta la app de Express ya configurada.
const { attachDatabasePool } = require('@vercel/functions');
const { loadConfig } = require('./config');
const { createPool } = require('./db/pool');
const { seed } = require('./db/seed');
const { createUserRepository } = require('./repositories/userRepository');
const { createTokenService } = require('./services/tokenService');
const { createApp } = require('./app');

const config = loadConfig();
const pool = createPool(config.databaseUrl);
// En Vercel, libera las conexiones inactivas antes de que la función se suspenda.
attachDatabasePool(pool);

// Deja la base como recién creada: borra todos los usuarios y vuelve a sembrar los de ejemplo.
async function resetDemo() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE users RESTART IDENTITY');
    await seed(client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = createApp({
  userRepo: createUserRepository(pool),
  tokenService: createTokenService(config.jwt),
  config,
  resetDemo,
});
