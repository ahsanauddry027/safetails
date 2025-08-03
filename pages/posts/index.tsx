// pages/posts/index.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";

const Posts = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  // State for posts data
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State for filtering
  const [filters, setFilters] = useState({
    postType: "",
    status: "active"
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Fetch posts when component mounts or filters change
  useEffect(() => {
    fetchPosts();
  }, [currentPage, filters]);
  
  // Handle query params from URL
  useEffect(() => {
    const { postType, status, page } = router.query;
    
    const newFilters = { ...filters };
    if (postType) newFilters.postType = postType as string;
    if (status) newFilters.status = status as string;
    setFilters(newFilters);
    
    if (page) setCurrentPage(parseInt(page as string));
  }, [router.query]);
  
  // Fetch posts from API
  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.postType) params.append("postType", filters.postType);
      if (filters.status) params.append("status", filters.status);
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      
      // Fetch posts
      const response = await axios.get(`/api/posts?${params.toString()}`);
      
      setPosts(response.data.posts);
      setTotalPosts(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setCurrentPage(1); // Reset to first page when filters change
    
    // Update URL with new filters
    const newQuery = { ...router.query, [name]: value, page: "1" };
    if (!value) delete newQuery[name];
    router.push({
      pathname: router.pathname,
      query: newQuery
    }, undefined, { shallow: true });
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // Update URL with new page
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: page.toString() }
    }, undefined, { shallow: true });
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };
  
  // Get post type badge color
  const getPostTypeColor = (type) => {
    switch (type) {
      case "missing":
        return "bg-red-100 text-red-800";
      case "emergency":
        return "bg-orange-100 text-orange-800";
      case "wounded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pet Posts</h1>
          {user && (
            <Link
              href="/create-post"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Post
            </Link>
          )}
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="postType" className="block text-gray-700 font-medium mb-2">
                Post Type
              </label>
              <select
                id="postType"
                name="postType"
                value={filters.postType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="missing">Missing Pets</option>
                <option value="emergency">Emergency</option>
                <option value="wounded">Wounded Pets</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-gray-700 font-medium mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Posts List */}
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <Link href={`/posts/${post._id}`}>
                      <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h2>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getPostTypeColor(post.postType)}`}>
                                {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(post.status)}`}>
                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{post.description}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>Pet: {post.petName} ({post.petType})</span>
                              <span className="mx-2">•</span>
                              <span>Posted: {formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                          {post.userId && (
                            <div className="flex items-center">
                              {post.userId.profileImage ? (
                                <img
                                  src={post.userId.profileImage}
                                  alt={post.userId.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500">{post.userId.name.charAt(0)}</span>
                                </div>
                              )}
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{post.userId.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No posts found matching your criteria.</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or create a new post.</p>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Posts;