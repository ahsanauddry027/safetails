import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/db';
import Report from '@/models/Report';
import PetPost from '@/models/PetPost';
import { verifyToken } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getReports(req, res);
      case 'POST':
        return await createReport(req, res);
      case 'PUT':
        return await updateReport(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Report controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get reports (admin only)
async function getReports(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status) filter.status = status;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate('postId', 'title images')
      .populate('reportedBy', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    return res.status(500).json({ message: 'Failed to fetch reports' });
  }
}

// Create a new report
async function createReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { postId, reason, description } = req.body;

    if (!postId || !reason || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if post exists
    const post = await PetPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already reported this post
    const existingReport = await Report.findOne({
      postId,
      reportedBy: decoded.id,
      status: { $in: ['pending', 'reviewed'] }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    const report = new Report({
      postId,
      reportedBy: decoded.id,
      reason,
      description
    });

    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ message: 'Failed to submit report' });
  }
}

// Update report status (admin only)
async function updateReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.query;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updateData: any = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (status === 'reviewed' || status === 'resolved' || status === 'dismissed') {
      updateData.reviewedBy = decoded.id;
      updateData.reviewedAt = new Date();
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return res.status(500).json({ message: 'Failed to update report' });
  }
}

