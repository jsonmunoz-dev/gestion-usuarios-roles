const express = require('express');
const { notFound, unauthorized } = require('../errors');

// Reinicio de los datos de la demo pública. Lo llama Vercel Cron una vez al día
// con el header "Authorization: Bearer <CRON_SECRET>".
function demoRouter({ config, resetDemo }) {
  const router = express.Router();

  router.get('/reset', async (req, res) => {
    if (!config.demoMode || !config.cronSecret || !resetDemo) throw notFound('Ruta no encontrada');
    if (req.get('authorization') !== `Bearer ${config.cronSecret}`) throw unauthorized();
    await resetDemo();
    res.json({ status: 'ok', resetAt: new Date().toISOString() });
  });

  return router;
}

module.exports = { demoRouter };
