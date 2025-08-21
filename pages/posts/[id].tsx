// pages/posts/[id].tsx
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";
import dynamic from "next/dynamic";
import ReportPostModal from "@/components/ReportPostModal";

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center">
      <div className="loading-spinner"></div>
      <p className="ml-4 text-gray-600">Loading map...</p>
    </div>
  )
});

const PostDetail = () => {
  const { user } = useAuth();

  type AuthUserType = {
    _id?: string;
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    role?: string;
  };
  const router = useRouter();
  const { id } = router.query;
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Define Post type
  type UserType = {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    role?: string;
  };

  type CommentType = {
    userId: UserType;
    text: string;
    createdAt: string;
  };

  type LocationType = {
    coordinates: [number, number];
    address?: string;
    description?: string;
  };

  type PostType = {
    _id: string;
    title: string;
    description: string;
    postType: string;
    status: string;
    isEmergency?: boolean;
    userId: UserType;
    createdAt: string;
    petName?: string;
    petType?: string;
    petBreed?: string;
    petAge?: string;
    petGender?: string;
    petColor?: string;
    lastSeenDate?: string;
    location?: LocationType;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    comments?: CommentType[];
    images?: string[];
  };

  // State for post data
  const [post, setPost] = useState<PostType | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [resolvingPost, setResolvingPost] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Map container style
  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  // Fetch post when component mounts
  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  // Fetch post from API
  const fetchPost = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`/api/posts/${id}`);
      console.log("Post data received:", response.data.data);
      console.log("Images array:", response.data.data.images);
      setPost(response.data.data);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    setError(""); // Clear any previous errors

    try {
      const response = await axios.patch(`/api/posts/${id}`, {
        action: "comment",
        text: commentText,
      });

      if (response.data.success) {
        setCommentText("");
        fetchPost(); // Refresh post data to show new comment
      } else {
        setError(response.data.message || "Failed to submit comment. Please try again.");
      }
    } catch (err: any) {
      console.error("Error submitting comment:", err);
      let errorMessage = "Failed to submit comment. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid comment data. Please check your input.";
      } else if (err.response?.status === 401) {
        errorMessage = "Please log in to comment.";
      } else if (err.response?.status === 403) {
        errorMessage = "You are not authorized to comment on this post.";
      }
      
      setError(errorMessage);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle resolving post
  const handleResolvePost = async () => {
    if (!confirm("Are you sure you want to mark this post as resolved?"))
      return;

    setResolvingPost(true);

    try {
      await axios.patch(`/api/posts/${id}`, {
        action: "resolve",
      });

      fetchPost(); // Refresh post data to show resolved status
    } catch (err) {
      console.error("Error resolving post:", err);
      setError("Failed to resolve post. Please try again.");
    } finally {
      setResolvingPost(false);
    }
  };

  // Handle deleting post
  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone."))
      return;

    try {
      await axios.delete(`/api/posts/${id}`);
      
      // Redirect to posts page after successful deletion
      router.push('/posts?deleted=true');
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post. Please try again.");
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  // Check if user can resolve the post
  const canResolvePost = () => {
    if (!user || !post) return false;
    if (post.status !== "active") return false;

    // Post owner can resolve
    if (
      post.userId._id ===
      ((user as AuthUserType)._id ?? (user as AuthUserType).id)
    )
      return true;

    // Admins and vets can resolve
    if (user.role === "admin" || user.role === "vet") return true;

    return false;
  };

  // Check if user can delete the post
  const canDeletePost = () => {
    if (!user || !post) return false;

    // Only admins can delete posts
    if (user.role === "admin") return true;

    return false;
  };

  return (
    <>
      <Head>
        <title>{post ? `${post.title} | SafeTails` : "Post | SafeTails"}</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-8">
                         <button
               onClick={() => router.back()}
               className="flex items-center text-black hover:text-gray-700 transition-colors duration-300 font-semibold cursor-pointer"
             >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Posts
            </button>
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
              <p className="ml-4 text-gray-600 font-medium">Loading post...</p>
            </div>
          ) : post ? (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200 hover:border-black transition-all duration-300">
              {/* Post Header */}
              <div className="p-8 border-b-2 border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-black mb-4">
                      {post.title}
                    </h1>
                    <div className="flex items-center space-x-3 mb-6">
                      <span
                        className={`px-4 py-2 text-sm font-semibold rounded-full border ${getPostTypeColor(
                          post.postType
                        )}`}
                      >
                        {post.postType
                          ? post.postType.charAt(0).toUpperCase() +
                            post.postType.slice(1)
                          : "Unknown"}
                      </span>
                      <span
                        className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(
                          post.status
                        )}`}
                      >
                        {post.status
                          ? post.status.charAt(0).toUpperCase() +
                            post.status.slice(1)
                          : "Unknown"}
                      </span>
                      {post.isEmergency && (
                        <span className="px-4 py-2 text-sm font-semibold rounded-full border bg-red-100 text-red-800 border-red-200">
                          Emergency
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-lg text-gray-600">
                      <span>Posted by: <span className="font-semibold text-black">{post.userId.name}</span></span>
                      <span className="mx-3">•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                                         {/* Resolve Button */}
                     {canResolvePost() && (
                       <button
                         onClick={handleResolvePost}
                         disabled={resolvingPost}
                         className="px-6 py-3 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                        {resolvingPost ? "Resolving..." : "Mark as Resolved"}
                      </button>
                    )}

                                         {/* Delete Button */}
                     {canDeletePost() && (
                       <button
                         onClick={handleDeletePost}
                         className="px-6 py-3 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer"
                       >
                        Delete Post
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Images Section */}
              {post.images && post.images.length > 0 ? (
                <div className="p-8 border-b-2 border-gray-200">
                  <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                    Pet Photos ({post.images.length})
                  </h2>
                  

                  
                  {/* Main Image */}
                  <div className="mb-6">
                    <img
                      src={selectedImage || post.images[0]}
                      alt={`${post.petName} photo`}
                      className="w-full h-96 object-cover rounded-2xl border-2 border-gray-200 hover:border-black transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedImage(selectedImage || post.images[0])}
                      onError={(e) => {
                        console.error("Image failed to load:", e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Thumbnail Gallery */}
                  {post.images.length > 1 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {post.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`${post.petName} photo ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              (selectedImage || post.images[0]) === image
                                ? 'border-black'
                                : 'border-gray-200 group-hover:border-black'
                            }`}
                            onClick={() => setSelectedImage(image)}
                            onError={(e) => {
                              console.error(`Thumbnail ${index} failed to load:`, e);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 border-b-2 border-gray-200">
                  <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                    Pet Photos
                  </h2>
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No photos uploaded for this pet</p>
                  </div>
                </div>
              )}

              {/* Pet Information */}
              <div className="p-8 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Pet Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Name</p>
                    <p className="text-black font-semibold text-lg">{post.petName}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Type</p>
                    <p className="text-black font-semibold text-lg">{post.petType}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Breed</p>
                    <p className="text-black font-semibold text-lg">{post.petBreed || "Not specified"}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Age</p>
                    <p className="text-black font-semibold text-lg">{post.petAge || "Not specified"}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Gender</p>
                    <p className="text-black font-semibold text-lg">{post.petGender || "Not specified"}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Color</p>
                    <p className="text-black font-semibold text-lg">{post.petColor || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-8 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Description
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                  {post.description}
                </p>
              </div>

              {/* Last Seen Date (for missing pets) */}
              {post.postType === "missing" && post.lastSeenDate && (
                <div className="p-8 border-b-2 border-gray-200">
                  <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last Seen
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {formatDate(post.lastSeenDate)}
                  </p>
                </div>
              )}

              {/* Location */}
              {post.location && post.location.coordinates && (
                <div className="p-8 border-b-2 border-gray-200">
                  <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </h2>
                  {post.location.address && (
                    <p className="text-gray-600 text-lg mb-4">
                      {post.location.address}
                    </p>
                  )}
                  {post.location.description && (
                    <p className="text-gray-600 text-lg mb-6">
                      {post.location.description}
                    </p>
                  )}

                  {/* Leaflet Map */}
                  <div
                    style={mapContainerStyle}
                    className="rounded-2xl overflow-hidden border-2 border-gray-200"
                  >
                    <LeafletMap
                      center={[post.location.coordinates[1], post.location.coordinates[0]]}
                      onMapClick={() => {}} // Read-only map, no click handler needed
                      markers={[
                        {
                          position: [post.location.coordinates[1], post.location.coordinates[0]],
                          popup: 'Post Location'
                        }
                      ]}
                      height="400px"
                    />
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="p-8 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Name</p>
                    <p className="text-black font-semibold text-lg">{post.contactName || post.userId.name}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Phone</p>
                    <p className="text-black font-semibold text-lg">{post.contactPhone || post.userId.phone || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <p className="text-gray-600 mb-1 font-medium">Email</p>
                    <p className="text-black font-semibold text-lg">{post.contactEmail || post.userId.email}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-8 border-b-2 border-gray-200">
                <div className="flex flex-wrap gap-4 justify-center">
                  {user && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-6 py-3 bg-black text-white rounded-md font-medium"
                    >
                      Report Post
                    </button>
                  )}
                  {user && (user._id === post.userId._id || user.role === 'admin') && post.status === 'active' && (
                    <button
                      onClick={handleResolvePost}
                      disabled={resolvingPost}
                      className="px-6 py-3 bg-gray-800 text-white rounded-md font-medium disabled:bg-gray-400"
                    >
                      {resolvingPost ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Comments ({post.comments?.length || 0})
                </h2>

                {/* Comment Form */}
                {user && post.status === "active" && (
                  <form onSubmit={handleCommentSubmit} className="mb-8">
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}
                    <div className="mb-4">
                      <label
                        htmlFor="comment"
                        className="block text-lg font-semibold text-gray-700 mb-3"
                      >
                        Add a comment
                      </label>
                      <textarea
                        id="comment"
                        ref={commentInputRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={4}
                        className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                        placeholder="Write your comment here..."
                        required
                      />
                    </div>
                                         <button
                       type="submit"
                       disabled={submittingComment || !commentText.trim()}
                       className="group relative inline-flex items-center justify-center px-6 py-3 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                      <span className="relative z-10 font-bold">
                        {submittingComment ? "Submitting..." : "Submit Comment"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </form>
                )}

                {/* Comments List */}
                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-6">
                    {post.comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200 hover:border-black transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            {comment.userId?.profileImage ? (
                              <img
                                src={comment.userId.profileImage}
                                alt={comment?.userId?.name?.charAt(0) ?? "?"}
                                className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4 border-2 border-gray-200">
                                <span className="text-gray-500 font-semibold">
                                  {comment?.userId?.name?.charAt(0) ?? "?"}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-black text-lg">
                                {comment?.userId?.name ?? "?"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(comment.createdAt)}
                              </p>
                            </div>
                          </div>
                          {comment.userId?.role === "vet" && (
                            <span className="px-3 py-1 text-sm font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                              Vet
                            </span>
                          )}
                          {comment.userId?.role === "admin" && (
                            <span className="px-3 py-1 text-sm font-semibold rounded-full border bg-purple-100 text-purple-800 border-purple-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No comments yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-gray-200">
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                </svg>
                <p className="text-gray-500 text-xl font-semibold mb-2">Post not found</p>
                <p className="text-gray-500 mb-6">The post may have been removed or doesn't exist.</p>
                                 <Link
                   href="/posts"
                   className="group relative inline-flex items-center justify-center px-6 py-3 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1 cursor-pointer"
                 >
                  <span className="relative z-10 font-bold">Return to Posts</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Post Modal */}
      {showReportModal && (
        <ReportPostModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          postId={post?._id || ''}
          postTitle={post?.title || ''}
        />
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Pet photo"
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
                         <button
               onClick={() => setSelectedImage(null)}
               className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all duration-300 cursor-pointer"
             >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PostDetail;
