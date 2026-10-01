import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/register', register);
router.post('/login', login);

// Ruta protegida de perfil
router.get('/me', verifyToken, getMe);

export default router;
