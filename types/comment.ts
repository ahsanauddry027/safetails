export interface CommentUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface Comment {
  _id: string;
  user: CommentUser;
  userType: 'user' | 'vet';
  content: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentFormData {
  content: string;
  rating: number;
}

export interface CommentResponse {
  success: boolean;
  message?: string;
  data?: Comment;
}

export interface CommentsResponse {
  success: boolean;
  message?: string;
  data: Comment[];
}

export interface UserComment {
  _id: string;
  content: string;
  rating: number;
  isApproved: boolean;
}

export interface CommentFormProps {
  onCommentSubmitted: () => void;
  onClose: () => void;
}

import { NextApiRequest } from 'next';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
  };
}
