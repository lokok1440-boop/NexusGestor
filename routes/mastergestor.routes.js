const express = require('express');
const router = express.Router();
const masterGestorController = require('../controllers/mastergestor.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Middleware exclusivo para Master Gestor (admin NÃO tem acesso)
const masterGestorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'master_gestor') {
    return next();
  }
  return res.status(403).json({ error: 'Acesso negado. Apenas Master Gestor.' });
};

router.get('/dashboard', authMiddleware, masterGestorOnly, masterGestorController.getDashboardData);
router.put('/metas', authMiddleware, masterGestorOnly, masterGestorController.updateMetasComerciais);

module.exports = router;
