// src/middleware/cors.ts
import { NextRequest, NextResponse } from 'next/server';

export const corsMiddleware = (allowedOrigins: string[] = []) => {
  return (req: NextRequest) => {
    const origin = req.headers.get('origin') || '';
    const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

    const response = NextResponse.next();

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, X-Requested-With, x-auth-token'
      );
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
    }

    if (req.method === 'OPTIONS') {
      response.headers.set('Access-Control-Max-Age', '86400');
      return new NextResponse(null, { status: 204 });
    }

    return response;
  };
};