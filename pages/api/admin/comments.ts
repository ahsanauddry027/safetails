import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import CommentController from '../../../controllers/CommentController';
import { verifyToken } from '../../../utils/auth';
import { adminAuth } from '../../../utils/adminAuth';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Verify admin authentication
  const { token } = cookie.parse(req.headers.cookie || "");
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    const isAdmin = await adminAuth(decoded.id);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    (req as any).user = decoded;
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  switch (req.method) {
    case 'GET':
      return CommentController.getAllComments(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
