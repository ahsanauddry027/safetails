import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../utils/db';
import CommentController from '../../../controllers/CommentController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return CommentController.getApprovedComments(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
