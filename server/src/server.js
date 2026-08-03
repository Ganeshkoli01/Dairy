import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import rateChartRoutes from './routes/rateChartRoutes.js';
import milkCollectionRoutes from './routes/milkCollectionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();

// Database Connection
connectDB();

// Middleware
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/rate-chart', rateChartRoutes);
app.use('/api/milk-collection', milkCollectionRoutes);
app.use('/api/reports', reportRoutes);

// Base route handler
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Dairy Milk Collection System API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      branches: '/api/branches',
      farmers: '/api/farmers',
      rateChart: '/api/rate-chart',
      milkCollection: '/api/milk-collection',
      reports: '/api/reports',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Express] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
