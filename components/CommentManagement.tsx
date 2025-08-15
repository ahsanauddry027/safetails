import { useState, useEffect } from 'react';
import axios from 'axios';

interface Comment {
  _id: string;
  content: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  userType: 'user' | 'vet';
}

interface CommentManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentManagement({ isOpen, onClose }: CommentManagementProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/comments', {
        withCredentials: true
      });
      setComments(response.data.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId: string, isApproved: boolean) => {
    try {
      await axios.put(`/api/admin/comments/${commentId}`, 
        { isApproved },
        { withCredentials: true }
      );
      
      // Update the comment in the local state
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, isApproved }
          : comment
      ));
      
      // Clear any previous errors and show success message
      setError('');
      setSuccessMessage(`Comment ${isApproved ? 'approved' : 'rejected'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Failed to update comment status');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/comments/${commentId}`, {
        withCredentials: true
      });
      
      // Remove the comment from the local state
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      
      // Clear any previous errors and show success message
      setError('');
      setSuccessMessage('Comment deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display">Comment Management</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner"></div>
              <p className="ml-4 text-gray-600">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No comments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className={`border-2 rounded-2xl p-6 transition-all duration-300 ${
                    comment.isApproved
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            {comment.user.name}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            comment.user.role === 'admin' 
                              ? 'bg-red-100 text-red-800'
                              : comment.user.role === 'vet'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {comment.user.role}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            comment.userType === 'vet' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {comment.userType}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {renderStars(comment.rating)}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        comment.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {comment.isApproved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!comment.isApproved && (
                        <button
                          onClick={() => handleApprove(comment._id, true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Approve
                        </button>
                      )}
                      {comment.isApproved && (
                        <button
                          onClick={() => handleApprove(comment._id, false)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
