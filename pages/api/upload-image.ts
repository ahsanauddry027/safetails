// pages/api/upload-image.ts
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Check if user is authenticated
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    // Verify token
    const decoded = verifyToken(token) as { id: string };
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    // Validate that it's a base64 image
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: "Invalid image format" });
    }

    // For now, we'll store the base64 image directly
    // In a production environment, you might want to:
    // 1. Upload to a cloud storage service (AWS S3, Cloudinary, etc.)
    // 2. Compress the image
    // 3. Generate thumbnails
    // 4. Validate file size and dimensions

    // Basic validation for image size (max 5MB)
    const base64Data = image.split(',')[1];
    const imageSize = Math.ceil((base64Data.length * 3) / 4);
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (imageSize > maxSize) {
      return res.status(400).json({ success: false, message: "Image size too large. Maximum size is 5MB." });
    }

    // Return the image data (in production, return the uploaded URL)
    res.status(200).json({ 
      success: true, 
      imageUrl: image,
      message: "Image uploaded successfully" 
    });

  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ success: false, message: "Failed to upload image" });
  }
}
