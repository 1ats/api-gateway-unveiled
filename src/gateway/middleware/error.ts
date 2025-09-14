import { Request, Response, NextFunction } from 'express';

export interface ApiError {
  statusCode: number;
  message: string;
  service?: string;
  originalError?: any;
}

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Gateway Error:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let service = extractServiceFromUrl(req.originalUrl);

  // Handle specific error types
  if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  } else if (error.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Service timeout';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  }

  const errorResponse = {
    error: {
      message,
      statusCode,
      service,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.error['requestId'] = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
};

const extractServiceFromUrl = (url: string): string | undefined => {
  const match = url.match(/^\/api\/([^\/]+)/);
  return match ? match[1] : undefined;
};

export class GatewayError extends Error {
  statusCode: number;
  service?: string;

  constructor(message: string, statusCode = 500, service?: string) {
    super(message);
    this.statusCode = statusCode;
    this.service = service;
    this.name = 'GatewayError';
  }
}