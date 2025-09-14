import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import { healthCheck } from './routes/health';
import { serviceRegistry } from './config/services';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Basic middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// Health check
app.use('/health', healthCheck);

// Auth middleware for protected routes
app.use('/api', authMiddleware);

// Dynamic service routing
Object.entries(serviceRegistry).forEach(([serviceName, config]) => {
  const proxyOptions = {
    target: config.url,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${serviceName}`]: config.basePath || ''
    },
    onProxyReq: (proxyReq: any, req: any) => {
      // Add service identification headers
      proxyReq.setHeader('X-Gateway-Service', serviceName);
      proxyReq.setHeader('X-Gateway-User', req.user?.id || 'anonymous');
    },
    onError: (err: any, req: any, res: any) => {
      console.error(`Proxy error for ${serviceName}:`, err);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: serviceName
      });
    }
  };

  app.use(`/api/${serviceName}`, createProxyMiddleware(proxyOptions));
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📋 Registered services: ${Object.keys(serviceRegistry).join(', ')}`);
});

export default app;