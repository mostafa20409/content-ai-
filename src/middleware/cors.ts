// src/middleware/cors.ts
import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (allowedOrigins: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin || '';
    const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

    if (isAllowedOrigin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, X-Requested-With, x-auth-token'
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
    }

    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Max-Age', '86400');
      res.status(204).end();
      return;
    }

    next();
  };
};