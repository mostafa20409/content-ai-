import express, { Request, Response } from 'express';
import { corsMiddleware } from './middleware/cors';
import { authMiddleware } from './middleware/auth';

const app = express();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-production-domain.com'
];

// Middlewares
app.use(express.json());
app.use(corsMiddleware(allowedOrigins));

// --- نوع للـ Request بعد الميدلوير ---
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isVerified?: boolean;
  };
}

// Routes
app.get('/api/protected', authMiddleware(), (req: AuthRequest, res: Response) => {
  res.json({ message: 'هذا مسار محمي', user: req.user });
});

export default app;