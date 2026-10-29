require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function loadConfig(env = process.env) {
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }

  return {
    port: Number(env.PORT) || 4000,
    databaseUrl: env.DATABASE_URL,
    clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
    isProduction: env.NODE_ENV === 'production',
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN || '15m',
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
  };
}

module.exports = { loadConfig };
