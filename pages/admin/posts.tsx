import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';

type PetPost = {
  _id: string;
  title: string;
  postType: 'missing' | 'emergency' | 'wounded';
  petName: string;
  description: string;
  status: 'active' | 'resolved';
  location?: {
    coordinates?: [number, number];
    address?: string;
    type?: string;
    description?: string;
  };
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const AdminPostsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState<PetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [filters, setFilters] = useState({
    postType: '',
    status: ''
  });

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch posts when page loads or filters change
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPosts();
    }
  }, [pagination.page, filters, user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.postType && { postType: filters.postType }),
        ...(filters.status && { status: filters.status })
      });

      const response = await axios.get(`/api/admin/posts?${params}`, {
        withCredentials: true
      });

      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Handle authentication errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          router.push('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to page 1 when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; postId: string | null; postTitle: string }>({
    show: false,
    postId: null,
    postTitle: ''
  });
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const handleDeletePost = async (postId: string, postTitle: string) => {
    setDeleteConfirm({
      show: true,
      postId,
      postTitle
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.postId) return;

    setDeletingPostId(deleteConfirm.postId);

    try {
      await axios.delete(`/api/posts/${deleteConfirm.postId}`, {
        withCredentials: true
      });
      
      // Remove the post from the local state
      setPosts(prev => prev.filter(post => post._id !== deleteConfirm.postId));
      
      // Show success message
      alert("Post deleted successfully");
    } catch (error) {
      console.error('Error deleting post:', error);
      // Handle authentication errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          router.push('/login');
          return;
        }
      }
      alert("Failed to delete post. Please try again.");
    } finally {
      setDeletingPostId(null);
      setDeleteConfirm({ show: false, postId: null, postTitle: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, postId: null, postTitle: '' });
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getPostTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'missing':
        return 'bg-yellow-100 text-yellow-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'wounded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner"></div>
        <p className="ml-4 text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Router will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black font-display">Pet Posts Management</h1>
          <Link href="/admin-dashboard" className="px-6 py-3 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer">
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12 border-4 border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
              <label htmlFor="postType" className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
              <select
                id="postType"
                name="postType"
                value={filters.postType}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="missing">Missing Pet</option>
                <option value="emergency">Emergency</option>
                <option value="wounded">Wounded Pet</option>
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="w-full md:w-1/2 flex items-end">
              <button
                onClick={() => fetchPosts()}
                className="group relative inline-flex items-center justify-center px-6 py-3 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold">Apply Filters</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="group bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200 hover:border-black transition-all duration-300">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="loading-spinner"></div>
              <p className="ml-4 text-gray-600 font-medium">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No posts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-gray-50 transition-all duration-200 hover:shadow-sm border-l-4 border-l-transparent hover:border-l-blue-500">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 mb-1">{post.title}</div>
                          <div className="text-sm text-gray-500 mb-1">Pet: {post.petName}</div>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPostTypeBadgeClass(post.postType)}`}>
                              {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
                            </span>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(post.status)}`}>
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{post.userId.name}</div>
                        <div className="text-sm text-gray-500">{post.userId.email}</div>
                      </td>
                                             <td className="px-6 py-4">
                         <div className="text-sm text-gray-500">
                           {post.location ? (
                             <>
                               {post.location.address && (
                                 <div className="font-medium">{post.location.address}</div>
                               )}
                               {post.location.coordinates && post.location.coordinates.length === 2 && (
                                 <div className="text-xs text-gray-400 mt-1">
                                   Coordinates: {post.location.coordinates[0].toFixed(6)}, {post.location.coordinates[1].toFixed(6)}
                                 </div>
                               )}
                               {post.location.description && (
                                 <div className="text-xs text-gray-400 mt-1">
                                   {post.location.description}
                                 </div>
                               )}
                               {!post.location.address && !post.location.coordinates && (
                                 <div className="text-gray-400 italic">Location data incomplete</div>
                               )}
                               
                             </>
                           ) : (
                             <div className="text-gray-400 italic">No location data</div>
                           )}
                         </div>
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link 
                            href={`/posts/${post._id}`} 
                            className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg transition-all duration-200 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 hover:scale-105 transform hover:shadow-md"
                          >
                            <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post._id, post.title)}
                            disabled={deletingPostId === post._id}
                            className={`group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md active:scale-95 ${
                              deletingPostId === post._id
                                ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                : 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700'
                            }`}
                          >
                            {deletingPostId === post._id ? (
                              <>
                                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${pagination.page === pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span> of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.page === page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${pagination.page === pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-4 border-gray-200">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Post</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.postTitle}"</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={cancelDelete}
                    className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deletingPostId !== null}
                    className={`px-6 py-3 text-white border rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      deletingPostId !== null
                        ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                        : 'bg-red-600 border-red-600 hover:bg-red-700'
                    }`}
                  >
                    {deletingPostId !== null ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete Post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPostsPage;