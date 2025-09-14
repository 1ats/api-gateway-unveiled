export interface ServiceConfig {
  url: string;
  basePath?: string;
  healthPath?: string;
  timeout?: number;
  retries?: number;
  requireAuth?: boolean;
}

// Configure your microservices here
export const serviceRegistry: Record<string, ServiceConfig> = {
  // Example services - replace with your actual microservices
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    basePath: '/auth',
    healthPath: '/health',
    timeout: 5000,
    requireAuth: false
  },
  users: {
    url: process.env.USERS_SERVICE_URL || 'http://localhost:3002',
    basePath: '/api',
    healthPath: '/health',
    timeout: 10000,
    requireAuth: true
  },
  orders: {
    url: process.env.ORDERS_SERVICE_URL || 'http://localhost:3003',
    basePath: '/api',
    healthPath: '/health',
    timeout: 15000,
    requireAuth: true
  },
  products: {
    url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3004',
    basePath: '/api',
    healthPath: '/health',
    timeout: 10000,
    requireAuth: false
  },
  payments: {
    url: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3005',
    basePath: '/api',
    healthPath: '/health',
    timeout: 20000,
    requireAuth: true
  },
  notifications: {
    url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3006',
    basePath: '/api',
    healthPath: '/health',
    timeout: 5000,
    requireAuth: true
  },
  analytics: {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3007',
    basePath: '/api',
    healthPath: '/health',
    timeout: 10000,
    requireAuth: true
  },
  // Add your other 33+ services here following the same pattern
  // service1: {
  //   url: process.env.SERVICE1_URL || 'http://localhost:3008',
  //   basePath: '/api',
  //   healthPath: '/health',
  //   timeout: 10000,
  //   requireAuth: true
  // },
};

export const getServiceConfig = (serviceName: string): ServiceConfig | null => {
  return serviceRegistry[serviceName] || null;
};

export const listServices = (): string[] => {
  return Object.keys(serviceRegistry);
};