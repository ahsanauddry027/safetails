// controllers/PetPostController.ts
import PetPost from "@/models/PetPost";
import User from "@/models/User";
import mongoose from "mongoose";

export class PetPostController {
  // Create a new pet post
  static async createPost(postData: any, userId: string) {
    try {
      // Verify that the user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Create the post
      const newPost = await PetPost.create({
        ...postData,
        userId
      });

      return newPost;
    } catch (error) {
      console.error("Create post error:", error);
      throw error;
    }
  }

  // Get all posts with optional filtering
  static async getPosts(query: any = {}, limit: number = 20, skip: number = 0) {
    try {
      const filter: any = {};
      
      // Apply filters if provided
      if (query.postType) filter.postType = query.postType;
      if (query.status) filter.status = query.status;
      if (query.userId) filter.userId = query.userId;
      
      // Get total count for pagination
      const total = await PetPost.countDocuments(filter);
      
      // Get posts with populated user data
      const posts = await PetPost.find(filter)
        .populate("userId", "name email profileImage")
        .populate("resolvedBy", "name email profileImage")
        .populate("comments.userId", "name email profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return {
        posts,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error("Get posts error:", error);
      throw error;
    }
  }

  // Get a single post by ID
  static async getPostById(postId: string) {
    try {
      const post = await PetPost.findById(postId)
        .populate("userId", "name email profileImage")
        .populate("resolvedBy", "name email profileImage")
        .populate("comments.userId", "name email profileImage");
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Increment view count
      await PetPost.findByIdAndUpdate(postId, { $inc: { views: 1 } });
      
      return post;
    } catch (error) {
      console.error("Get post by ID error:", error);
      throw error;
    }
  }

  // Update a post
  static async updatePost(postId: string, updateData: any, userId: string) {
    try {
      // Find the post
      const post = await PetPost.findById(postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Check if the user is the owner of the post
      if (post.userId.toString() !== userId) {
        throw new Error("Not authorized to update this post");
      }
      
      // Update the post
      const updatedPost = await PetPost.findByIdAndUpdate(
        postId,
        updateData,
        { new: true }
      );
      
      return updatedPost;
    } catch (error) {
      console.error("Update post error:", error);
      throw error;
    }
  }

  // Mark a post as resolved
  static async resolvePost(postId: string, userId: string) {
    try {
      // Find the post
      const post = await PetPost.findById(postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Check if the user is the owner of the post or an admin/vet
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      if (post.userId.toString() !== userId && user.role !== "admin" && user.role !== "vet") {
        throw new Error("Not authorized to resolve this post");
      }
      
      // Update the post
      const resolvedPost = await PetPost.findByIdAndUpdate(
        postId,
        { 
          status: "resolved",
          resolvedAt: new Date(),
          resolvedBy: userId
        },
        { new: true }
      );
      
      return resolvedPost;
    } catch (error) {
      console.error("Resolve post error:", error);
      throw error;
    }
  }

  // Delete a post
  static async deletePost(postId: string, userId: string) {
    try {
      // Find the post
      const post = await PetPost.findById(postId);
      
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Check if the user is the owner of the post or an admin
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      if (post.userId.toString() !== userId && user.role !== "admin") {
        throw new Error("Not authorized to delete this post");
      }
      
      // Delete the post
      await PetPost.findByIdAndDelete(postId);
      
      return { success: true, message: "Post deleted successfully" };
    } catch (error) {
      console.error("Delete post error:", error);
      throw error;
    }
  }

  // Add a comment to a post
  static async addComment(postId: string, userId: string, text: string) {
    try {
      // Verify that the user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      // Find the post
      const post = await PetPost.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Add the comment
      const updatedPost = await PetPost.findByIdAndUpdate(
        postId,
        { 
          $push: { 
            comments: { 
              userId, 
              text,
              createdAt: new Date() 
            } 
          } 
        },
        { new: true }
      ).populate("comments.userId", "name email profileImage");
      
      return updatedPost;
    } catch (error) {
      console.error("Add comment error:", error);
      throw error;
    }
  }

  // Find nearby posts based on location
  static async findNearbyPosts(longitude: number, latitude: number, maxDistance: number = 10000, postType?: string) {
    try {
      const filter: any = {
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            $maxDistance: maxDistance // in meters
          }
        },
        status: "active"
      };
      
      // Add post type filter if provided
      if (postType) {
        filter.postType = postType;
      }
      
      const posts = await PetPost.find(filter)
        .populate("userId", "name email profileImage")
        .sort({ createdAt: -1 });
      
      return posts;
    } catch (error) {
      console.error("Find nearby posts error:", error);
      throw error;
    }
  }
}