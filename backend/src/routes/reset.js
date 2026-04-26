import express from 'express';
import { masterReset, getMasterResetInfo } from '../controllers/resetController.js';

const router = express.Router();

// GET: Información sobre qué se eliminaría
router.get('/info', getMasterResetInfo);

// POST: Ejecutar reseteo maestro (requiere confirmación)
router.post('/execute', masterReset);

export default router;
