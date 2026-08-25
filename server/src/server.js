import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import rateChartRoutes from './routes/rateChartRoutes.js';
import milkCollectionRoutes from './routes/milkCollectionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import procurementRoutes from './routes/procurementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();

// Database Connection will be initialized before server start

// Middleware
app.use(helmet());

const clientOriginString = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = [
  ...clientOriginString.split(',').map(origin => origin.trim()),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://gkdairy.online',
  'https://www.gkdairy.online',
  'https://dairy-lime.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/rate-chart', rateChartRoutes);
app.use('/api/milk-collection', milkCollectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/procurements', procurementRoutes);
app.use('/api/notifications', notificationRoutes);

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
      billing: '/api/billing',
      products: '/api/products',
      orders: '/api/orders',
      upload: '/api/upload',
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

// Connect to Database
connectDB().then(() => {
  // Only skip listening on a port if we are explicitly running on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`[Express] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  }
}).catch((err) => {
  console.error("Failed to connect to DB, server not started", err);
});

// Export the app for Vercel Serverless
export default app;

// Trigger nodemon restart

// Trigger restart again

// Restart trigger 2
