import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import Adoption, { IAdoption } from "@/models/Adoption";
// import AdoptionApplication from "@/models/AdoptionApplication";
// import User from "@/models/User";
import { verifyToken } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const { method } = req;

  try {
    switch (method) {
      case "GET":
        return await getAdoptions(req, res);
      case "POST":
        return await createAdoption(req, res);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res
          .status(405)
          .json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error("Adoption handler error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Get adoptions with filtering and pagination
async function getAdoptions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = "1",
      limit = "10",
      status,
      adoptionType,
      petType,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: import("mongoose").FilterQuery<IAdoption> = {};

    if (status) filter.status = status;
    if (adoptionType) filter.adoptionType = adoptionType;
    if (petType) filter.petType = petType;

    if (search) {
      (filter as unknown as Record<string, unknown>).$or = [
        { description: { $regex: search as string, $options: "i" } },
        { petBreed: { $regex: search as string, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Adoption.countDocuments(filter);

    // Get adoptions with pagination
    const adoptions = await Adoption.find(filter)
      .populate("userId", "name email phone")
      .populate("adopter.userId", "name email phone")
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
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching adoptions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Create a new adoption listing
async function createAdoption(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decodedRaw = await verifyToken(token);
    if (
      !decodedRaw ||
      typeof decodedRaw !== "object" ||
      !("id" in decodedRaw) ||
      typeof (decodedRaw as Record<string, unknown>).id !== "string"
    ) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const userId = (decodedRaw as { id: string }).id;

    const {
      petType,
      petBreed,
      petAge,
      petGender,
      petCategory,
      petColor,
      description,
      images,
      adoptionType,
      adoptionFee,
      isSpayedNeutered,
      isVaccinated,
      isMicrochipped,
      specialNeeds,
      medicalHistory,
      temperament,
      goodWith,
      requirements,
    } = req.body;

    // Validate required fields
    if (!petType || !description || !adoptionType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create adoption listing
    const adoption = new Adoption({
      petType,
      petBreed: petBreed || undefined,
      petAge: petAge || undefined,
      petGender: petGender || "unknown",
      petColor: petColor || undefined,
      petCategory: petCategory || undefined,
      description,
      images: images || [],
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
        otherPets: false,
      },
      requirements: requirements || [],
      userId,
      status: "available",
    });

    await adoption.save();

    // Populate user info
    await adoption.populate("userId", "name email phone");

    return res.status(201).json({
      success: true,
      message: "Adoption listing created successfully",
      data: adoption,
    });
  } catch (error) {
    console.error("Error creating adoption:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
