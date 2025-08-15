// pages/api/vet-directory/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { VetDirectoryController } from "@/controllers/VetDirectoryController";
import { adminAuth } from "@/utils/adminAuth";
import { userAuth } from "@/utils/userAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const { 
          specialization, 
          isEmergencyAvailable, 
          is24Hours, 
          city, 
          state,
          search,
          longitude,
          latitude,
          distance = "50" // Default 50km
        } = req.query;

        let vets;
        const filters: any = {};

        // Apply filters
        if (specialization) {
          filters.specialization = Array.isArray(specialization) 
            ? specialization 
            : [specialization];
        }
        if (isEmergencyAvailable !== undefined) {
          filters.isEmergencyAvailable = isEmergencyAvailable === "true";
        }
        if (is24Hours !== undefined) {
          filters.is24Hours = is24Hours === "true";
        }
        if (city) filters.city = city;
        if (state) filters.state = state;

        // Handle location-based search
        if (longitude && latitude) {
          const lng = parseFloat(longitude as string);
          const lat = parseFloat(latitude as string);
          const maxDistance = parseFloat(distance as string) * 1000; // Convert km to meters
          
          vets = await VetDirectoryController.findNearbyVets(lng, lat, maxDistance, filters);
        }
        // Handle text search
        else if (search) {
          vets = await VetDirectoryController.searchVets(search as string, filters);
        }
        // Get all vets with filters
        else {
          vets = await VetDirectoryController.getAllVets(filters);
        }

        res.status(200).json({
          success: true,
          data: vets,
          count: vets.length,
        });
      } catch (error) {
        console.error("Error fetching vet directory:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch vet directory",
        });
      }
      break;

    case "POST":
      try {
        // Only vets can create vet directory entries
        const authResult = await userAuth(req, res);
        if (!authResult || authResult.user.role !== 'vet') {
          return res.status(401).json({
            success: false,
            message: "Unauthorized: Only veterinarians can create vet directory entries",
          });
        }

        const vetData = req.body;
        // Ensure the vetId matches the authenticated user
        vetData.vetId = authResult.user._id;
        
        const newVet = await VetDirectoryController.createVetEntry(vetData);

        res.status(201).json({
          success: true,
          data: newVet,
          message: "Vet directory entry created successfully",
        });
      } catch (error) {
        console.error("Error creating vet directory entry:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create vet directory entry",
        });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
