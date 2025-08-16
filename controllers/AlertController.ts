import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/utils/db';
import Alert from '@/models/Alert';
import { verifyToken } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getAlerts(req, res);
      case 'POST':
        return await createAlert(req, res);
      case 'PUT':
        return await updateAlert(req, res);
      case 'DELETE':
        return await deleteAlert(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Alert controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get alerts with geolocation filtering
async function getAlerts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      latitude,
      longitude,
      radius = '10',
      type,
      urgency,
      status = 'active',
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const radiusNum = parseInt(radius as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {
      status,
      isActive: true
    };

    if (type) filter.type = type;
    if (urgency) filter.urgency = urgency;

    let alerts;
    let total;

    // Add geolocation filter if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      try {
        // Use $geoWithin with $centerSphere for better compatibility
        filter['location.coordinates'] = {
          $geoWithin: {
            $centerSphere: [
              [lng, lat],
              radiusNum / 6371 // Convert km to radians (Earth radius = 6371 km)
            ]
          }
        };

        // Get total count and alerts with geospatial filter
        total = await Alert.countDocuments(filter);
        
        alerts = await Alert.find(filter)
          .populate('createdBy', 'name email')
          .sort({ urgency: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum);
          
      } catch (geoError: any) {
        console.error('Geospatial query error:', geoError);
        // Fallback to regular query without geospatial filtering
        total = await Alert.countDocuments(filter);
        
        alerts = await Alert.find(filter)
          .populate('createdBy', 'name email')
          .sort({ urgency: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum);
      }
    } else {
      // No geolocation filter, use regular find
      total = await Alert.countDocuments(filter);
      
      alerts = await Alert.find(filter)
        .populate('createdBy', 'name email')
        .sort({ urgency: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: alerts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error: any) {
    console.error('Error getting alerts:', error);
    
    // Check if it's a geospatial index error
    if (error.code === 5626500 || error.codeName === 'Location5626500') {
      return res.status(500).json({ 
        message: 'Geospatial query error. Please ensure the database has proper geospatial indexes.',
        error: 'Geospatial index not available'
      });
    }
    
    return res.status(500).json({ message: 'Failed to fetch alerts' });
  }
}

// Create a new alert
async function createAlert(req: NextApiRequest, res: NextApiResponse) {
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
      type,
      title,
      description,
      location,
      petDetails,
      urgency,
      targetAudience,
      expiresAt
    } = req.body;

    // Validate required fields
    if (!type || !title || !description || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create new alert
    const alert = new Alert({
      type,
      title,
      description,
      location,
      petDetails,
      urgency: urgency || 'medium',
      targetAudience: targetAudience || 'nearby',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: decoded.id
    });

    await alert.save();

    return res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return res.status(500).json({ message: 'Failed to create alert' });
  }
}

// Update an alert
async function updateAlert(req: NextApiRequest, res: NextApiResponse) {
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

    const { id } = req.query;
    const updateData = req.body;

    // Find alert and check ownership
    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.createdBy.toString() !== decoded.id) {
      return res.status(403).json({ message: 'Not authorized to update this alert' });
    }

    // Update alert
    const updatedAlert = await Alert.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Alert updated successfully',
      data: updatedAlert
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return res.status(500).json({ message: 'Failed to update alert' });
  }
}

// Delete an alert
async function deleteAlert(req: NextApiRequest, res: NextApiResponse) {
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

    const { id } = req.query;

    // Find alert and check ownership
    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.createdBy.toString() !== decoded.id) {
      return res.status(403).json({ message: 'Not authorized to delete this alert' });
    }

    // Soft delete by setting status to expired
    await Alert.findByIdAndUpdate(id, {
      status: 'expired',
      isActive: false,
      updatedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return res.status(500).json({ message: 'Failed to delete alert' });
  }
}
