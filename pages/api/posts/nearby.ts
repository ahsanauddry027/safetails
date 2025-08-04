// pages/api/posts/nearby.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { PetPostController } from "@/controllers/PetPostController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // Extract query parameters
    const { longitude, latitude, distance, postType } = req.query;

    // Validate required parameters
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
      });
    }

    // Convert parameters to appropriate types
    const lng = parseFloat(longitude as string);
    const lat = parseFloat(latitude as string);
    const maxDistance = distance
      ? parseFloat(distance as string) * 1000
      : 10000; // Convert km to meters, default 10km

    // Handle multiple post types (comma-separated)
    let postTypes: string[] | undefined;
    if (postType) {
      postTypes = (postType as string).split(",").map((type) => type.trim());
    }

    // Find nearby posts
    const posts = await PetPostController.findNearbyPosts(
      lng,
      lat,
      maxDistance,
      postTypes
    );

    res.status(200).json({ success: true, data: posts });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }
}
