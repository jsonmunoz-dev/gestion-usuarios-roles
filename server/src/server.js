const { loadConfig } = require('./config');
const { createPool } = require('./db/pool');
const { createUserRepository } = require('./repositories/userRepository');
const { createTokenService } = require('./services/tokenService');
const { createApp } = require('./app');

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const app = createApp({
  userRepo: createUserRepository(pool),
  tokenService: createTokenService(config.jwt),
  config,
});

const server = app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => pool.end().then(() => process.exit(0)));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
