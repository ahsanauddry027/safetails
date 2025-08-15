import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import PetPost from '../../../../models/PetPost';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for now
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const { token } = cookie.parse(req.headers.cookie || "");
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Connect to database
    await dbConnect();

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const postType = req.query.postType as string;
    const status = req.query.status as string;

    // Build query
    const query: Record<string, string> = {};
    if (postType) query.postType = postType;
    if (status) query.status = status;

    // Get posts with pagination
    const posts = await PetPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role');

    // Get total count for pagination
    const total = await PetPost.countDocuments(query);

    // Return posts with pagination info
    return res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}