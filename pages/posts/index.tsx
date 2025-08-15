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
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Update URL with new page
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: page.toString() }
    }, undefined, { shallow: true });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };
  
  // Get post type badge color
  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "missing":
        return "bg-red-100 text-red-800 border-red-200";
      case "emergency":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "wounded":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-black mb-2">Pet Posts</h1>
            <p className="text-gray-600 text-lg">Find and help pets in need</p>
          </div>
          {user && (
            <Link
              href="/create-post"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
            >
              <span className="relative z-10 font-bold text-lg">Create Post</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Link>
          )}
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-gray-200 hover:border-black transition-all duration-300">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="postType" className="block text-lg font-semibold text-gray-700 mb-3">
                Post Type
              </label>
              <select
                id="postType"
                name="postType"
                value={filters.postType}
                onChange={handleFilterChange}
                className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
              >
                <option value="">All Types</option>
                <option value="missing">Missing Pets</option>
                <option value="emergency">Emergency</option>
                <option value="wounded">Wounded Pets</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-lg font-semibold text-gray-700 mb-3">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
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
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
            <p className="ml-4 text-gray-600 font-medium">Loading posts...</p>
          </div>
        ) : (
          <>
            {/* Posts List */}
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post._id} className="group bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-3xl hover:-translate-y-1">
                    <Link href={`/posts/${post._id}`}>
                      <div className="p-8 cursor-pointer hover:bg-gray-50 transition-all duration-300">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Images Section */}
                          {post.images && post.images.length > 0 && (
                            <div className="lg:w-1/3">
                              <div className="relative">
                                <img
                                  src={post.images[0]}
                                  alt={`${post.petName} photo`}
                                  className="w-full h-48 lg:h-64 object-cover rounded-2xl border-2 border-gray-200 group-hover:border-black transition-all duration-300"
                                />
                                {post.images.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                                    +{post.images.length - 1} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Content Section */}
                          <div className="lg:w-2/3 flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h2 className="text-2xl font-bold text-black mb-3 group-hover:text-gray-700 transition-colors duration-300">
                                  {post.title}
                                </h2>
                                <div className="flex items-center space-x-3 mb-4">
                                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getPostTypeColor(post.postType)}`}>
                                    {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
                                  </span>
                                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(post.status)}`}>
                                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-6 text-lg leading-relaxed line-clamp-3">
                                  {post.description}
                                </p>
                                
                                {/* Pet Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                  <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-sm text-gray-500 font-medium">Pet Name</p>
                                    <p className="text-black font-semibold">{post.petName}</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-sm text-gray-500 font-medium">Type</p>
                                    <p className="text-black font-semibold">{post.petType}</p>
                                  </div>
                                  {post.petBreed && (
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                      <p className="text-sm text-gray-500 font-medium">Breed</p>
                                      <p className="text-black font-semibold">{post.petBreed}</p>
                                    </div>
                                  )}
                                  {post.petAge && (
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                      <p className="text-sm text-gray-500 font-medium">Age</p>
                                      <p className="text-black font-semibold">{post.petAge}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <div className="flex items-center space-x-4">
                                    <span>Posted: {formatDate(post.createdAt)}</span>
                                    {post.views > 0 && (
                                      <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {post.views} views
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* User Info */}
                              {post.userId && (
                                <div className="flex items-center ml-4">
                                  {post.userId.profileImage ? (
                                    <img
                                      src={post.userId.profileImage}
                                      alt={post.userId.name}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                                      <span className="text-gray-500 font-semibold">{post.userId.name.charAt(0)}</span>
                                    </div>
                                  )}
                                  <div className="ml-3">
                                    <p className="text-sm font-semibold text-black">{post.userId.name}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-gray-200">
                <div className="flex flex-col items-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                  <p className="text-gray-500 text-xl font-semibold mb-2">No posts found</p>
                  <p className="text-gray-500">Try adjusting your filters or create a new post.</p>
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2 bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-200">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-black border-2 border-gray-200'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                        currentPage === page 
                          ? 'bg-black text-white border-2 border-black' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-black border-2 border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-black border-2 border-gray-200'
                    }`}
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