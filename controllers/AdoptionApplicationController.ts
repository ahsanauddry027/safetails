import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/db';
import AdoptionApplication from '@/models/AdoptionApplication';
import Adoption from '@/models/Adoption';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getAdoptionApplications(req, res);
      case 'POST':
        return await createAdoptionApplication(req, res);
      case 'PUT':
        return await updateAdoptionApplication(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Adoption application controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get adoption applications with filtering
async function getAdoptionApplications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      adoptionId,
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
    
    if (adoptionId) filter.adoptionId = adoptionId;
    if (applicantId) filter.applicantId = applicantId;
    if (status) filter.status = status;

    // Get total count
    const total = await AdoptionApplication.countDocuments(filter);
    
    // Get applications with pagination
    const applications = await AdoptionApplication.find(filter)
      .populate('adoptionId', 'petName petType petBreed status')
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
    console.error('Error getting adoption applications:', error);
    return res.status(500).json({ message: 'Failed to fetch adoption applications' });
  }
}

// Create a new adoption application
async function createAdoptionApplication(req: NextApiRequest, res: NextApiResponse) {
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
      adoptionId,
      personalInfo,
      experience,
      homeEnvironment,
      financial,
      motivation,
      references,
      additionalInfo
    } = req.body;

    // Validate required fields
    if (!adoptionId || !personalInfo || !experience || !homeEnvironment || !financial || !motivation || !references) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if adoption listing exists and is available
    const adoption = await Adoption.findById(adoptionId);
    if (!adoption) {
      return res.status(404).json({ message: 'Adoption listing not found' });
    }

    if (adoption.status !== 'available') {
      return res.status(400).json({ message: 'Adoption listing is not accepting applications' });
    }

    // Check if user already applied
    const existingApplication = await AdoptionApplication.findOne({
      adoptionId,
      applicantId: decoded.userId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this adoption' });
    }

    // Create adoption application
    const adoptionApplication = new AdoptionApplication({
      adoptionId,
      applicantId: decoded.userId,
      personalInfo,
      experience,
      homeEnvironment,
      financial,
      motivation,
      references,
      additionalInfo,
      status: 'pending'
    });

    await adoptionApplication.save();

    // Add application to adoption listing
    await Adoption.findByIdAndUpdate(adoptionId, {
      $push: { applications: adoptionApplication._id }
    });

    // Populate related data
    await adoptionApplication.populate('adoptionId', 'petName petType petBreed status');
    await adoptionApplication.populate('applicantId', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Adoption application submitted successfully',
      data: adoptionApplication
    });
  } catch (error) {
    console.error('Error creating adoption application:', error);
    return res.status(500).json({ message: 'Failed to submit adoption application' });
  }
}

// Update adoption application (for admin approval/rejection)
async function updateAdoptionApplication(req: NextApiRequest, res: NextApiResponse) {
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
    const updatedApplication = await AdoptionApplication.findByIdAndUpdate(
      applicationId,
      {
        status,
        adminNotes,
        adminId: decoded.userId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('adoptionId', 'petName petType petBreed status')
     .populate('applicantId', 'name email phone')
     .populate('adminId', 'name email');

    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // If approved, update adoption listing status
    if (status === 'approved') {
      await Adoption.findByIdAndUpdate(updatedApplication.adoptionId, {
        status: 'pending',
        adopter: {
          userId: updatedApplication.applicantId._id,
          name: updatedApplication.personalInfo.name,
          email: updatedApplication.personalInfo.email,
          phone: updatedApplication.personalInfo.phone,
          applicationId: updatedApplication._id
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating adoption application:', error);
    return res.status(500).json({ message: 'Failed to update application' });
  }
}
