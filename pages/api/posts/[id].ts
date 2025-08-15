// pages/api/posts/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/db";
import { PetPostController } from "@/controllers/PetPostController";
import { verifyTokenAndCheckBlocked } from "@/utils/auth";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  await dbConnect();

  // Helper function to get user ID from token
  const getUserIdFromToken = async (req: NextApiRequest) => {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      return null;
    }

    try {
      const decoded = await verifyTokenAndCheckBlocked(token);
      return decoded?.id || null;
    } catch (error) {
      return null;
    }
  };

  switch (method) {
    case "GET":
      try {
        const post = await PetPostController.getPostById(id as string);
        res.status(200).json({ success: true, data: post });
      } catch (error: unknown) {
        const message =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : "An error occurred";
        res.status(404).json({ success: false, message });
      }
      break;

    case "PUT":
      try {
        // Check if user is authenticated
        const userId = await getUserIdFromToken(req);
        if (!userId) {
          return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
        }

        // Update post
        const updatedPost = await PetPostController.updatePost(
          id as string,
          req.body,
          userId
        );

        res.status(200).json({ success: true, data: updatedPost });
      } catch (error: unknown) {
        const errMsg =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : "An error occurred";
        if (errMsg === "Not authorized to update this post") {
          res.status(403).json({ success: false, message: errMsg });
        } else if (errMsg === "Post not found") {
          res.status(404).json({ success: false, message: errMsg });
        } else {
          res.status(500).json({ success: false, message: errMsg });
        }
      }
      break;

    case "DELETE":
      try {
        // Check if user is authenticated
        const userId = await getUserIdFromToken(req);
        if (!userId) {
          return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
        }

        // Delete post
        await PetPostController.deletePost(id as string, userId);

        res
          .status(200)
          .json({ success: true, message: "Post deleted successfully" });
      } catch (error: unknown) {
        const errMsg =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : "An error occurred";
        if (errMsg === "Not authorized to delete this post") {
          res.status(403).json({ success: false, message: errMsg });
        } else if (errMsg === "Post not found") {
          res.status(404).json({ success: false, message: errMsg });
        } else {
          res.status(500).json({ success: false, message: errMsg });
        }
      }
      break;

    case "PATCH":
      try {
        // Check if user is authenticated
        const userId = await getUserIdFromToken(req);
        if (!userId) {
          return res
            .status(401)
            .json({ success: false, message: "Not authenticated" });
        }

        // Check the action type
        const { action } = req.body;

        if (action === "resolve") {
          // Resolve post
          const resolvedPost = await PetPostController.resolvePost(
            id as string,
            userId
          );
          res.status(200).json({ success: true, data: resolvedPost });
        } else if (action === "comment") {
          // Add comment
          const { text } = req.body;
          if (!text) {
            return res
              .status(400)
              .json({ success: false, message: "Comment text is required" });
          }

          const updatedPost = await PetPostController.addComment(
            id as string,
            userId,
            text
          );
          res.status(200).json({ success: true, data: updatedPost });
        } else {
          res.status(400).json({ success: false, message: "Invalid action" });
        }
      } catch (error: unknown) {
        const errMsg =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : "An error occurred";
        if (errMsg === "Not authorized to resolve this post") {
          res.status(403).json({ success: false, message: errMsg });
        } else if (errMsg === "Post not found" || errMsg === "User not found") {
          res.status(404).json({ success: false, message: errMsg });
        } else {
          res.status(500).json({ success: false, message: errMsg });
        }
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE", "PATCH"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
