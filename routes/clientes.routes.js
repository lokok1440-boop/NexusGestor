const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientes.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/', authMiddleware, ctrl.listClientes);
router.post('/', authMiddleware, adminOnly, ctrl.createCliente);
router.post('/import', authMiddleware, adminOnly, upload.single('file'), ctrl.importClientesFromXLSX);
router.put('/:id', authMiddleware, adminOnly, ctrl.updateCliente);
router.delete('/:id', authMiddleware, adminOnly, ctrl.deleteCliente);

module.exports = router;
