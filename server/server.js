import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';  // Add this import
import rateLimit from 'express-rate-limit'; // Add this import
import { connectDB } from './config/db.config.js';
import authRoutes from './routes/authRoutes.routes.js';
import analysisRoutes from './routes/analysisRoutes.routes.js';

dotenv.config();
const app = express();

// Security middlewares
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://ai-fake-news-detector-59xc4z2za-piyushs-projects-815384e6.vercel.app',
    'https://ai-fake-news-detector.vercel.app',
    'https://ai-fake-news-detector-backend.onrender.com'  // Add your backend URL
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('CORS blocked for origin:', origin);
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);

// Error handling middleware
   app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.name || 'InternalServerError',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    });
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});