import { NextApiRequest, NextApiResponse } from "next";
import FosterController from "@/controllers/FosterController";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return FosterController.getFosterRequests(req, res);
  } else if (req.method === "POST") {
    return FosterController.createFosterRequest(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
}
