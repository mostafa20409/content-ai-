import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // لو عاوز تختبر بس، هنبعت يوزر تجريبي
    return res.status(200).json({
      user: decoded || { id: 1, name: 'Test User' },
      notifications: []
    });

  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}