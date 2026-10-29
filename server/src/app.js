const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { authRouter } = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./errors');

// Las dependencias se inyectan para poder testear la app sin base de datos.
function createApp({ userRepo, tokenService, config }) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter({ userRepo, tokenService, config }));

  app.use((_req, _res, next) => next(notFound('Ruta no encontrada')));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
