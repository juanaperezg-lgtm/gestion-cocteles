import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import salesRoutes from './routes/sales.js';
import productsRoutes from './routes/products.js';
import purchasesRoutes from './routes/purchases.js';
import dashboardRoutes from './routes/dashboard.js';
import resetRoutes from './routes/reset.js';
import expensesRoutes from './routes/expenses.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Limit payload size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/purchases', authMiddleware, purchasesRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);
app.use('/api/reset', authMiddleware, resetRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);

  // Errores de validación JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🍹 Backend corriendo en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});
