// pages/api/upload-image.ts
import { NextApiRequest, NextApiResponse } from "next";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
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
    const decoded = await verifyTokenAndCheckBlocked(token);
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

    // Validate image format (PNG, JPEG, JPG)
    const allowedFormats = ['data:image/png', 'data:image/jpeg', 'data:image/jpg'];
    const isValidFormat = allowedFormats.some(format => image.startsWith(format));
    
    if (!isValidFormat) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid image format. Only PNG, JPEG, and JPG formats are allowed." 
      });
    }

    // Basic validation for image size (max 2MB)
    const base64Data = image.split(',')[1];
    const imageSize = Math.ceil((base64Data.length * 3) / 4);
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (imageSize > maxSize) {
      return res.status(400).json({ success: false, message: "Image size too large. Maximum size is 2MB." });
    }

    // For now, we'll store the base64 image directly
    // In a production environment, you might want to:
    // 1. Upload to a cloud storage service (AWS S3, Cloudinary, etc.)
    // 2. Compress the image using a server-side library like Sharp
    // 3. Generate thumbnails
    // 4. Validate file size and dimensions

    // Return the image data
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
