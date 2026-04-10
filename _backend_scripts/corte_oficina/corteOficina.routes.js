const express = require('express');
const router = express.Router();
const controller = require('../controllers/corteOficina.controller');
const { protect } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(protect);

// IMPORTANTE: rutas específicas ANTES de /:id para evitar conflictos
router.get('/pagos-disponibles', controller.getPagosDisponibles);
router.post('/', controller.createCorte);
router.get('/', controller.listCortes);
router.get('/:id', controller.getCorte);
router.put('/:id/cerrar', controller.cerrarCorte);
router.put('/:id/reabrir', controller.reabrirCorte);

module.exports = router;
