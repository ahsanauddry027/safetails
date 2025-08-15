// pages/api/vet-directory/emergency.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { VetDirectoryController } from "@/controllers/VetDirectoryController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  await dbConnect();

  try {
    const { longitude, latitude, distance = "100" } = req.query; // Default 100km for emergency

    let emergencyVets;
    
    if (longitude && latitude) {
      const lng = parseFloat(longitude as string);
      const lat = parseFloat(latitude as string);
      const maxDistance = parseFloat(distance as string) * 1000; // Convert km to meters
      
      emergencyVets = await VetDirectoryController.findNearbyVets(
        lng, 
        lat, 
        maxDistance, 
        { isEmergencyAvailable: true }
      );
    } else {
      emergencyVets = await VetDirectoryController.getEmergencyVets();
    }

    // Sort by priority: 24-hour vets first, then by rating
    emergencyVets.sort((a, b) => {
      if (a.is24Hours && !b.is24Hours) return -1;
      if (!a.is24Hours && b.is24Hours) return 1;
      return b.rating - a.rating;
    });

    res.status(200).json({
      success: true,
      data: emergencyVets,
      count: emergencyVets.length,
      message: "Emergency vets retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching emergency vets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch emergency vets",
    });
  }
}
