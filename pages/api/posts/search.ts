// pages/api/posts/search.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import PetPost from "@/models/PetPost";

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
    const {
      search,
      postType,
      status,
      petType,
      petCategory,
      city,
      state,
      isEmergency,
      dateRange,
      limit = "20",
      page = "1"
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const filter: any = {};

    // Apply filters
    if (postType) filter.postType = postType;
    if (status) filter.status = status;
    if (petType) filter.petType = petType;
    if (petCategory) filter.petCategory = petCategory;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };
    if (isEmergency !== undefined) filter.isEmergency = isEmergency === 'true';

    // Handle date range filter
    if (dateRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        default:
          startDate = new Date(0);
      }
      
      filter.createdAt = { $gte: startDate };
    }

    // Handle text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Get total count for pagination
    const total = await PetPost.countDocuments(filter);

    // Get posts with populated user data
    const posts = await PetPost.find(filter)
      .populate("userId", "name email profileImage")
      .populate("resolvedBy", "name email profileImage")
      .populate("comments.userId", "name email profileImage")
      .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    res.status(200).json({
      success: true,
      data: posts,
      total,
      page: Math.floor(skip / parseInt(limit as string)) + 1,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }
}
