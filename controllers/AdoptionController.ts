import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/db';
import Adoption from '@/models/Adoption';
import AdoptionApplication from '@/models/AdoptionApplication';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getAdoptions(req, res);
      case 'POST':
        return await createAdoption(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Adoption controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get adoptions with filtering and pagination
async function getAdoptions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      adoptionType,
      petType,
      city,
      state,
      search,
      minAge,
      maxAge
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};
    
    if (status) filter.status = status;
    if (adoptionType) filter.adoptionType = adoptionType;
    if (petType) filter.petType = petType;
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (state) filter['location.state'] = { $regex: state, $options: 'i' };
    
    if (search) {
      filter.$or = [
        { petName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { petBreed: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await Adoption.countDocuments(filter);
    
    // Get adoptions with pagination
    const adoptions = await Adoption.find(filter)
      .populate('userId', 'name email phone')
      .populate('adopter.userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: adoptions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting adoptions:', error);
    return res.status(500).json({ message: 'Failed to fetch adoptions' });
  }
}

// Create a new adoption listing
async function createAdoption(req: NextApiRequest, res: NextApiResponse) {
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
      adoptionType,
      adoptionFee,
      isSpayedNeutered,
      isVaccinated,
      isMicrochipped,
      specialNeeds,
      medicalHistory,
      temperament,
      goodWith,
      requirements
    } = req.body;

    // Validate required fields
    if (!petName || !petType || !description || !location || !adoptionType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate location coordinates
    if (!location.coordinates || location.coordinates.length !== 2 || 
        (location.coordinates[0] === 0 && location.coordinates[1] === 0)) {
      return res.status(400).json({ message: 'Valid location coordinates are required' });
    }
    
    // Validate coordinate ranges (longitude: -180 to 180, latitude: -90 to 90)
    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'Coordinates must be within valid ranges (longitude: -180 to 180, latitude: -90 to 90)' });
    }

    // Create adoption listing
    const adoption = new Adoption({
      petName,
      petType,
      petBreed: breed || undefined,
      petAge: age || undefined,
      petGender: gender || 'unknown',
      petColor: color || undefined,
      petCategory: size || undefined,
      description,
      images: images || [],
      location,
      adoptionType,
      adoptionFee: adoptionFee || 0,
      isSpayedNeutered: isSpayedNeutered || false,
      isVaccinated: isVaccinated || false,
      isMicrochipped: isMicrochipped || false,
      specialNeeds: specialNeeds || undefined,
      medicalHistory: medicalHistory || undefined,
      temperament: temperament || [],
      goodWith: goodWith || {
        children: false,
        otherDogs: false,
        otherCats: false,
        otherPets: false
      },
      requirements: requirements || [],
      userId: decoded.id,
      status: 'available'
    });

    await adoption.save();

    // Populate user info
    await adoption.populate('userId', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Adoption listing created successfully',
      data: adoption
    });
  } catch (error) {
    console.error('Error creating adoption listing:', error);
    return res.status(500).json({ message: 'Failed to create adoption listing' });
  }
}
