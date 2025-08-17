import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { ChatWebSocketServer } from './websocket/chat.server';
import authRoutes from './api/auth.routes';
import attorneyRoutes from './api/attorney.routes';
import userRoutes from './api/user.routes';
import matchRoutes from './api/match.routes';
import reviewRoutes from './api/review.routes';
import educationRoutes from './api/education.routes';
import adminRoutes from './api/admin.routes';
import healthRoutes from './api/health.routes';
import { monitoringService } from './middleware/monitoring';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Enhanced security middleware for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for production
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://judge-ca.vercel.app',
      'https://www.judge.ca',
      'https://judge.ca'
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api', limiter);

// Trust proxy for Railway
app.set('trust proxy', 1);

// Add monitoring middleware
app.use(monitoringService.requestTracker);
app.use(monitoringService.errorTracker);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attorneys', attorneyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/admin', adminRoutes);

// Health check routes
app.use('/health', healthRoutes);

// Initialize WebSocket server
const chatServer = new ChatWebSocketServer(httpServer);
logger.info('WebSocket server initialized');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Judge.ca API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      websocket: 'ws://localhost:' + PORT
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Production server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`WebSocket server enabled`);
  logger.info(`Health check available at: /health`);
});

export { app, httpServer, chatServer };