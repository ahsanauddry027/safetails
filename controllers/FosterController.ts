import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/db';
import FosterRequest from '@/models/FosterRequest';
import FosterApplication from '@/models/FosterApplication';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getFosterRequests(req, res);
      case 'POST':
        return await createFosterRequest(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Foster controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get foster requests with filtering and pagination
async function getFosterRequests(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      fosterType,
      petType,
      city,
      state,
      isUrgent,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};
    
    if (status) filter.status = status;
    if (fosterType) filter.fosterType = fosterType;
    if (petType) filter.petType = petType;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (state) filter['location.state'] = { $regex: state, $options: 'i' };
    if (isUrgent === 'true') filter.isUrgent = true;
    
    if (search) {
      filter.$or = [
        { petName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { petBreed: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await FosterRequest.countDocuments(filter);
    
    // Get foster requests with pagination
    const fosterRequests = await FosterRequest.find(filter)
      .populate('userId', 'name email phone')
      .populate('fosterParent.userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: fosterRequests,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting foster requests:', error);
    return res.status(500).json({ message: 'Failed to fetch foster requests' });
  }
}

// Create a new foster request
async function createFosterRequest(req: NextApiRequest, res: NextApiResponse) {
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
      petName,
      petType,
      breed,
      age,
      gender,
      size,
      color,
      description,
      images,
      location,
      fosterType,
      duration,
      startDate,
      endDate,
      requirements,
      specialNeeds,
      medicalHistory,
      isUrgent
    } = req.body;

    // Validate required fields
    if (!petName || !petType || !description || !location || !fosterType || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate location coordinates
    if (!location.coordinates || location.coordinates.length !== 2 || 
        (location.coordinates[0] === 0 && location.coordinates[1] === 0)) {
      return res.status(400).json({ message: 'Valid location coordinates are required' });
    }

    // Validate location address fields
    if (!location.address || !location.city || !location.state) {
      return res.status(400).json({ message: 'Address, city, and state are required' });
    }

    // Create foster request
    const fosterRequest = new FosterRequest({
      petName,
      petType,
      petBreed: breed || undefined,
      petAge: age || undefined,
      petGender: gender || undefined,
      petColor: color || undefined,
      petCategory: size || undefined,
      description,
      images: images || [],
      location,
      fosterType,
      duration: duration || 'Not specified',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      requirements: requirements || [],
      specialNeeds: specialNeeds || undefined,
      medicalHistory: medicalHistory || undefined,
      isUrgent: isUrgent || false,
      userId: decoded.id,
      status: 'pending'
    });

    await fosterRequest.save();

    // Populate user info
    await fosterRequest.populate('userId', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Foster request created successfully',
      data: fosterRequest
    });
  } catch (error) {
    console.error('Error creating foster request:', error);
    return res.status(500).json({ message: 'Failed to create foster request' });
  }
}
