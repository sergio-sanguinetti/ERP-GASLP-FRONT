const corteOficinaService = require('../../services/corteOficina.service');

exports.getPagosDisponibles = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ message: 'Faltan parámetros desde/hasta' });
    }
    const result = await corteOficinaService.getPagosDisponibles(desde, hasta);
    res.json(result);
  } catch (err) {
    console.error('[corteOficina] getPagosDisponibles:', err);
    res.status(500).json({ message: err.message || 'Error al obtener pagos disponibles' });
  }
};

exports.createCorte = async (req, res) => {
  try {
    const usuario = req.user;
    if (!usuario) return res.status(401).json({ message: 'No autorizado' });

    const creadoPorNombre = req.body.creadoPorNombre
      || [usuario.nombres, usuario.apellidoPaterno].filter(Boolean).join(' ').trim()
      || usuario.email
      || 'Oficina';

    const data = {
      ...req.body,
      creadoPorId: usuario.id,
      creadoPorNombre,
    };

    const corte = await corteOficinaService.createCorte(data);
    res.status(201).json(corte);
  } catch (err) {
    console.error('[corteOficina] createCorte:', err);
    res.status(400).json({ message: err.message || 'Error al crear corte' });
  }
};

exports.listCortes = async (req, res) => {
  try {
    const cortes = await corteOficinaService.listCortes(req.query);
    res.json(cortes);
  } catch (err) {
    console.error('[corteOficina] listCortes:', err);
    res.status(500).json({ message: err.message || 'Error al listar cortes' });
  }
};

exports.getCorte = async (req, res) => {
  try {
    const corte = await corteOficinaService.getCorte(req.params.id);
    res.json(corte);
  } catch (err) {
    console.error('[corteOficina] getCorte:', err);
    res.status(404).json({ message: err.message || 'Corte no encontrado' });
  }
};

exports.cerrarCorte = async (req, res) => {
  try {
    const corte = await corteOficinaService.cerrarCorte(req.params.id);
    res.json(corte);
  } catch (err) {
    console.error('[corteOficina] cerrarCorte:', err);
    res.status(400).json({ message: err.message || 'Error al cerrar corte' });
  }
};

exports.reabrirCorte = async (req, res) => {
  try {
    const usuario = req.user;
    if (!usuario) return res.status(401).json({ message: 'No autorizado' });
    const corte = await corteOficinaService.reabrirCorte(req.params.id, usuario.id, usuario.rol);
    res.json(corte);
  } catch (err) {
    console.error('[corteOficina] reabrirCorte:', err);
    res.status(403).json({ message: err.message || 'Error al reabrir corte' });
  }
};
