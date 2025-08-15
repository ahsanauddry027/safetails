import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { CommentFormProps, UserComment } from '@/types/comment';

const CommentForm: React.FC<CommentFormProps> = ({ onCommentSubmitted, onClose }) => {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingComment, setExistingComment] = useState<UserComment | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if user already has a comment
    checkExistingComment();
  }, []);

  const checkExistingComment = async () => {
    try {
      const response = await axios.get('/api/comments/user');
      if (response.data.success && response.data.data) {
        setExistingComment(response.data.data);
        setContent(response.data.data.content);
        setRating(response.data.data.rating);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error checking existing comment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const response = await axios({
        method,
        url: '/api/comments/user',
        data: { content, rating }
      });

      if (response.data.success) {
        onCommentSubmitted();
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your review?')) return;

    setLoading(true);
    try {
      await axios.delete('/api/comments/user');
      onCommentSubmitted();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete review';
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-black font-heading">
            {isEditing ? 'Edit Your Review' : 'Share Your Story'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3 font-heading">
              Your Rating
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-colors duration-200 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2 font-body">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3 font-heading">
              Your Review
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with SafeTails..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:ring-4 focus:ring-black focus:ring-opacity-10 transition-all duration-300 resize-none font-body"
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-sm text-gray-500 mt-2 font-body">
              {content.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-body">{error}</p>
            </div>
          )}

          {/* Status Message */}
          {existingComment && !existingComment.isApproved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm font-body">
                Your review is pending approval by our team.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-primary"
            >
              {loading ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-primary"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentForm;
