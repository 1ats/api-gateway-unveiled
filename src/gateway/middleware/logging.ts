import { Request, Response, NextFunction } from 'express';

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  userAgent: string;
  ip: string;
  userId?: string;
  responseTime: number;
  statusCode: number;
  service?: string;
}

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent') || '',
      ip: req.ip || req.connection.remoteAddress || '',
      userId: req.user?.id,
      responseTime,
      statusCode: res.statusCode,
      service: extractServiceFromUrl(req.originalUrl)
    };
    
    // Log to console (replace with your preferred logging service)
    console.log(JSON.stringify(logEntry));
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

const extractServiceFromUrl = (url: string): string | undefined => {
  const match = url.match(/^\/api\/([^\/]+)/);
  return match ? match[1] : undefined;
};

export const errorLogger = (error: any, req: Request, res: Response, next: NextFunction) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    service: extractServiceFromUrl(req.originalUrl)
  };
  
  console.error(JSON.stringify(logEntry));
  next(error);
};