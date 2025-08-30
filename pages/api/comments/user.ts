import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../utils/db";
import CommentController from "../../../controllers/CommentController";
import { verifyTokenAndCheckBlocked } from "../../../utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  // Verify authentication for all methods
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = await verifyTokenAndCheckBlocked(token);
    (req as any).user = decoded;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  switch (req.method) {
    case "GET":
      return CommentController.getUserComment(req as any, res);
    case "POST":
      return CommentController.createComment(req as any, res);
    case "PUT":
      return CommentController.updateComment(req as any, res);
    case "DELETE":
      return CommentController.deleteUserComment(req as any, res);
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}
