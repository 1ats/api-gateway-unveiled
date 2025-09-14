import { Router, Request, Response } from 'express';
import axios from 'axios';
import { serviceRegistry } from '../config/services';

const router = Router();

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
}

const checkServiceHealth = async (name: string, config: any): Promise<ServiceHealth> => {
  const startTime = Date.now();
  
  try {
    const healthUrl = `${config.url}${config.healthPath || '/health'}`;
    const response = await axios.get(healthUrl, {
      timeout: config.timeout || 5000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      name,
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      responseTime
    };
  } catch (error: any) {
    return {
      name,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
};

// Simple health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check with all services
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const serviceChecks = Object.entries(serviceRegistry).map(([name, config]) =>
      checkServiceHealth(name, config)
    );
    
    const services = await Promise.all(serviceChecks);
    
    const summary = {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      unhealthy: services.filter(s => s.status === 'unhealthy').length
    };
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (summary.unhealthy === summary.total) {
      overallStatus = 'unhealthy';
    } else if (summary.unhealthy > 0) {
      overallStatus = 'degraded';
    }
    
    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      summary
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 207 : 503;
    
    res.status(statusCode).json(healthResponse);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Individual service health check
router.get('/service/:serviceName', async (req: Request, res: Response) => {
  const { serviceName } = req.params;
  const config = serviceRegistry[serviceName];
  
  if (!config) {
    return res.status(404).json({
      error: 'Service not found',
      service: serviceName
    });
  }
  
  try {
    const health = await checkServiceHealth(serviceName, config);
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      service: serviceName,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

export { router as healthCheck };