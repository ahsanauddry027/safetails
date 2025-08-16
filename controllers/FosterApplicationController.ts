import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/db';
import FosterApplication from '@/models/FosterApplication';
import FosterRequest from '@/models/FosterRequest';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getFosterApplications(req, res);
      case 'POST':
        return await createFosterApplication(req, res);
      case 'PUT':
        return await updateFosterApplication(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Foster application controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get foster applications with filtering
async function getFosterApplications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      fosterRequestId,
      applicantId,
      status,
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};
    
    if (fosterRequestId) filter.fosterRequestId = fosterRequestId;
    if (applicantId) filter.applicantId = applicantId;
    if (status) filter.status = status;

    // Get total count
    const total = await FosterApplication.countDocuments(filter);
    
    // Get applications with pagination
    const applications = await FosterApplication.find(filter)
      .populate('fosterRequestId', 'petName petType petBreed status')
      .populate('applicantId', 'name email phone')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting foster applications:', error);
    return res.status(500).json({ message: 'Failed to fetch foster applications' });
  }
}

// Create a new foster application
async function createFosterApplication(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const {
      fosterRequestId,
      personalInfo,
      experience,
      homeEnvironment,
      motivation,
      references,
      additionalInfo
    } = req.body;

    // Validate required fields
    if (!fosterRequestId || !personalInfo || !experience || !homeEnvironment || !motivation || !references) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if foster request exists and is active
    const fosterRequest = await FosterRequest.findById(fosterRequestId);
    if (!fosterRequest) {
      return res.status(404).json({ message: 'Foster request not found' });
    }

    if (fosterRequest.status !== 'active' && fosterRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Foster request is not accepting applications' });
    }

    // Check if user already applied
    const existingApplication = await FosterApplication.findOne({
      fosterRequestId,
      applicantId: decoded.userId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this foster request' });
    }

    // Create foster application
    const fosterApplication = new FosterApplication({
      fosterRequestId,
      applicantId: decoded.userId,
      personalInfo,
      experience,
      homeEnvironment,
      motivation,
      references,
      additionalInfo,
      status: 'pending'
    });

    await fosterApplication.save();

    // Add application to foster request
    await FosterRequest.findByIdAndUpdate(fosterRequestId, {
      $push: { applications: fosterApplication._id }
    });

    // Populate related data
    await fosterApplication.populate('fosterRequestId', 'petName petType petBreed status');
    await fosterApplication.populate('applicantId', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Foster application submitted successfully',
      data: fosterApplication
    });
  } catch (error) {
    console.error('Error creating foster application:', error);
    return res.status(500).json({ message: 'Failed to submit foster application' });
  }
}

// Update foster application (for admin approval/rejection)
async function updateFosterApplication(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { applicationId } = req.query;
    const { status, adminNotes } = req.body;

    if (!applicationId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Update application
    const updatedApplication = await FosterApplication.findByIdAndUpdate(
      applicationId,
      {
        status,
        adminNotes,
        adminId: decoded.userId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('fosterRequestId', 'petName petType petBreed status')
     .populate('applicantId', 'name email phone')
     .populate('adminId', 'name email');

    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // If approved, update foster request status
    if (status === 'approved') {
      await FosterRequest.findByIdAndUpdate(updatedApplication.fosterRequestId, {
        status: 'matched',
        fosterParent: {
          userId: updatedApplication.applicantId._id,
          name: updatedApplication.personalInfo.name,
          email: updatedApplication.personalInfo.email,
          phone: updatedApplication.personalInfo.phone,
          experience: updatedApplication.experience.description,
          homeEnvironment: updatedApplication.homeEnvironment.homeType,
          otherPets: updatedApplication.homeEnvironment.otherPets,
          children: updatedApplication.homeEnvironment.children,
          workSchedule: updatedApplication.homeEnvironment.workSchedule,
          reason: updatedApplication.motivation.reason
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating foster application:', error);
    return res.status(500).json({ message: 'Failed to update application' });
  }
}
