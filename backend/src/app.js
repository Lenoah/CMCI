require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── Middlewares ──────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use('/api', require('./routes'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// ── Error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
});

// On ne démarre le serveur HTTP qu'en exécution normale.
// Pendant les tests (NODE_ENV=test), Supertest crée son propre serveur éphémère :
// inutile d'écouter sur un port réel (sinon le port reste occupé entre les tests).
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur CMCI démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;
