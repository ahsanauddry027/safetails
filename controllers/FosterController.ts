import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/db';
import FosterRequest from '@/models/FosterRequest';
import FosterApplication from '@/models/FosterApplication';
import User from '@/models/User';
import { verifyToken } from '@/utils/auth';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Connecting to database...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/safetails');
    await dbConnect();
    console.log('Database connected successfully');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    console.log('Mongoose connection host:', mongoose.connection.host);
    console.log('Mongoose connection name:', mongoose.connection.name);
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('Database error stack:', error.stack);
    return res.status(500).json({ message: 'Database connection failed' });
  }

  // Check if cookies middleware is working
  console.log('Request headers:', req.headers);
  console.log('Request cookies object:', req.cookies);
  console.log('Request cookies type:', typeof req.cookies);
  console.log('Cookie header:', req.headers.cookie);
  
  // Try to parse cookies manually if req.cookies is not available
  if (!req.cookies && req.headers.cookie) {
    console.log('req.cookies not available, parsing manually from headers');
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    console.log('Manually parsed cookies:', cookies);
  }

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
    console.error('Controller error stack:', error.stack);
    console.error('Controller error message:', error.message);
    console.error('Controller error name:', error.name);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    console.log('=== Foster Request Creation Started ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    console.log('Request body stringified:', JSON.stringify(req.body, null, 2));
    console.log('Cookies:', req.cookies);
    
    // Check if body is empty or undefined
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Request body is empty or undefined');
      console.error('Raw body:', req.body);
      console.error('Body keys:', Object.keys(req.body || {}));
      return res.status(400).json({ message: 'Request body is required' });
    }
    
    // Check if body is a string (needs parsing)
    if (typeof req.body === 'string') {
      console.log('Body is string, attempting to parse as JSON');
      try {
        req.body = JSON.parse(req.body);
        console.log('Body parsed successfully:', req.body);
      } catch (parseError) {
        console.error('Failed to parse body as JSON:', parseError);
        return res.status(400).json({ message: 'Invalid JSON in request body' });
      }
    }
    
    // Verify authentication - try multiple ways to get the token
    let token = req.cookies?.token;
    console.log('Token from req.cookies:', token);
    
    // If cookies not available, try parsing from headers
    if (!token && req.headers.cookie) {
      console.log('Parsing cookies from headers...');
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      console.log('Parsed cookies from headers:', cookies);
      token = cookies.token;
      console.log('Token from parsed headers:', token);
    }
    
    if (!token) {
      console.log('No token found in cookies or headers');
      console.log('Available cookies:', req.cookies);
      console.log('Cookie header:', req.headers.cookie);
      console.log('All headers:', req.headers);
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Token found, verifying...');
    let decoded: any;
    try {
      decoded = await verifyToken(token);
      if (!decoded) {
        console.log('Token verification failed - decoded is null/undefined');
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      console.log('Token verified successfully:', decoded);
      console.log('Decoded token type:', typeof decoded);
      console.log('Decoded token keys:', Object.keys(decoded));
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return res.status(401).json({ message: 'Token verification failed' });
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
      isUrgent,
      goodWith
    } = req.body;

    console.log('Extracted fields:', { petName, petType, description, location, fosterType, startDate });
    
    // Validate required fields
    if (!petName || !petType || !description || !location || !fosterType || !startDate) {
      console.log('Missing required fields:', { petName, petType, description, location, fosterType, startDate });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate location coordinates
    if (!location.coordinates || location.coordinates.length !== 2 || 
        (location.coordinates[0] === 0 && location.coordinates[1] === 0)) {
      console.log('Invalid location coordinates:', location.coordinates);
      return res.status(400).json({ message: 'Valid location coordinates are required' });
    }
    
    // Validate coordinate ranges (longitude: -180 to 180, latitude: -90 to 90)
    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      console.log('Coordinates out of valid range:', { lng, lat });
      return res.status(400).json({ message: 'Coordinates must be within valid ranges (longitude: -180 to 180, latitude: -90 to 90)' });
    }

    // Validate location address fields
    if (!location.address || !location.city || !location.state) {
      console.log('Missing location fields:', { address: location.address, city: location.city, state: location.state });
      return res.status(400).json({ message: 'Address, city, and state are required' });
    }
    
    console.log('Validation passed, creating foster request...');

    // Create foster request
    const fosterRequestData = {
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
      goodWith: goodWith || {
        dogs: false,
        cats: false,
        children: false,
        seniors: false
      },
      userId: decoded.id,
      status: 'pending'
    };
    
    console.log('Creating foster request with data:', JSON.stringify(fosterRequestData, null, 2));
    
    let fosterRequest: any;
    try {
      console.log('About to create FosterRequest model...');
      fosterRequest = new FosterRequest(fosterRequestData);
      console.log('FosterRequest model created successfully');
      console.log('Model instance:', fosterRequest);
      console.log('Model schema:', fosterRequest.schema);
      
      console.log('FosterRequest model created, saving...');
      await fosterRequest.save();
      console.log('FosterRequest saved successfully');
      console.log('Saved request ID:', fosterRequest._id);
    } catch (modelError) {
      console.error('Model creation/save error:', modelError);
      console.error('Model error name:', modelError.name);
      console.error('Model error message:', modelError.message);
      console.error('Model error stack:', modelError.stack);
      if (modelError.name === 'ValidationError') {
        console.error('Validation errors:', modelError.errors);
        console.error('Validation error details:', JSON.stringify(modelError.errors, null, 2));
      }
      throw modelError; // Re-throw to be caught by outer catch
    }

    // Populate user info
    try {
      await fosterRequest.populate('userId', 'name email phone');
      console.log('User info populated successfully');
    } catch (populateError) {
      console.error('Error populating user info:', populateError);
      // Don't fail the request for this, just log it
    }

    return res.status(201).json({
      success: true,
      message: 'Foster request created successfully',
      data: fosterRequest
    });
  } catch (error) {
    console.error('Error creating foster request:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors
      });
    }
    
    // Check if it's a MongoDB connection error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.error('MongoDB connection error:', error);
      return res.status(500).json({ 
        message: 'Database connection failed'
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to create foster request',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
