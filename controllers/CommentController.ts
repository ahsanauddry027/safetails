import { NextApiRequest, NextApiResponse } from 'next';
import Comment, { IComment } from '../models/Comment';
import User from '../models/User';

import { AuthenticatedRequest } from '../types/comment';

class CommentController {
  // Get all approved comments with user details
  static async getApprovedComments(req: NextApiRequest, res: NextApiResponse) {
    try {
      const comments = await Comment.find({ isApproved: true })
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(6);

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  // Create a new comment
  static async createComment(req: AuthenticatedRequest, res: NextApiResponse) {
    try {
      const { content, rating } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!content || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Content and rating are required'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Get user details to determine user type
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userType = user.role === 'vet' ? 'vet' : 'user';

      // Check if user has already commented
      const existingComment = await Comment.findOne({ user: userId });
      if (existingComment) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a review'
        });
      }

      // Create new comment
      const comment = new Comment({
        user: userId,
        userType,
        content,
        rating,
        isApproved: false // Comments need approval by default
      });

      await comment.save();

      // Populate user details for response
      await comment.populate('user', 'name email role');

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully and pending approval',
        data: comment
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit review'
      });
    }
  }

  // Get user's own comment
  static async getUserComment(req: AuthenticatedRequest, res: NextApiResponse) {
    try {
      const userId = req.user.id;

      const comment = await Comment.findOne({ user: userId })
        .populate('user', 'name email role');

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Error fetching user comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your review'
      });
    }
  }

  // Update user's comment
  static async updateComment(req: AuthenticatedRequest, res: NextApiResponse) {
    try {
      const { content, rating } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!content || !rating) {
        return res.status(400).json({
          success: false,
          message: 'Content and rating are required'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const comment = await Comment.findOne({ user: userId });
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Update comment
      comment.content = content;
      comment.rating = rating;
      comment.isApproved = false; // Reset approval status after update

      await comment.save();
      await comment.populate('user', 'name email role');

      res.json({
        success: true,
        message: 'Review updated successfully and pending approval',
        data: comment
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review'
      });
    }
  }

  // Delete user's comment
  static async deleteComment(req: AuthenticatedRequest, res: NextApiResponse) {
    try {
      const userId = req.user.id;

      const comment = await Comment.findOneAndDelete({ user: userId });
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review'
      });
    }
  }

  // Admin: Get all comments for approval
  static async getAllComments(req: NextApiRequest, res: NextApiResponse) {
    try {
      const comments = await Comment.find()
        .populate('user', 'name email role')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      console.error('Error fetching all comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  // Admin: Approve/Reject comment
  static async approveComment(req: NextApiRequest, res: NextApiResponse) {
    try {
      const { commentId } = req.query;
      const { isApproved } = req.body;

      const comment = await Comment.findByIdAndUpdate(
        commentId,
        { isApproved },
        { new: true }
      ).populate('user', 'name email role');

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        message: `Comment ${isApproved ? 'approved' : 'rejected'} successfully`,
        data: comment
      });
    } catch (error) {
      console.error('Error approving comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment status'
      });
    }
  }
}

export default CommentController;
