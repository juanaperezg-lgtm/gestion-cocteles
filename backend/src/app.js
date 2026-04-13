import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import salesRoutes from './routes/sales.js';
import productsRoutes from './routes/products.js';
import purchasesRoutes from './routes/purchases.js';
import dashboardRoutes from './routes/dashboard.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/purchases', authMiddleware, purchasesRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'API está funcionando correctamente' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🍹 Backend corriendo en puerto ${PORT}`);
});
