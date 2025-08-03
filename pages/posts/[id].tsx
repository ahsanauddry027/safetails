// pages/posts/[id].tsx
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";
import dynamic from "next/dynamic";

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 rounded-md flex items-center justify-center">Loading map...</div>
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
  const commentInputRef = useRef(null);

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
    user: UserType;
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
  };

  // State for post data
  const [post, setPost] = useState<PostType | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [resolvingPost, setResolvingPost] = useState(false);

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

    try {
      await axios.patch(`/api/posts/${id}`, {
        action: "comment",
        comment: commentText,
      });

      setCommentText("");
      fetchPost(); // Refresh post data to show new comment
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Failed to submit comment. Please try again.");
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
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getPostTypeColor = (type: string) => {
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

  return (
    <>
      <Head>
        <title>{post ? `${post.title} | SafeTails` : "Post | SafeTails"}</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg
                className="w-5 h-5 mr-1"
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
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : post ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Post Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {post.title}
                    </h1>
                    <div className="flex items-center space-x-2 mb-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPostTypeColor(
                          post.postType
                        )}`}
                      >
                        {post.postType
                          ? post.postType.charAt(0).toUpperCase() +
                            post.postType.slice(1)
                          : "Unknown"}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          post.status
                        )}`}
                      >
                        {post.status
                          ? post.status.charAt(0).toUpperCase() +
                            post.status.slice(1)
                          : "Unknown"}
                      </span>
                      {post.isEmergency && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Emergency
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Posted by: {post.userId.name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Resolve Button */}
                  {canResolvePost() && (
                    <button
                      onClick={handleResolvePost}
                      disabled={resolvingPost}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resolvingPost ? "Resolving..." : "Mark as Resolved"}
                    </button>
                  )}
                </div>
              </div>

              {/* Pet Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Pet Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Name:</span> {post.petName}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Type:</span> {post.petType}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Breed:</span>{" "}
                      {post.petBreed || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Age:</span>{" "}
                      {post.petAge || "Not specified"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Gender:</span>{" "}
                      {post.petGender || "Not specified"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Color:</span>{" "}
                      {post.petColor || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Description
                </h2>
                <p className="text-gray-600 whitespace-pre-line">
                  {post.description}
                </p>
              </div>

              {/* Last Seen Date (for missing pets) */}
              {post.postType === "missing" && post.lastSeenDate && (
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Last Seen
                  </h2>
                  <p className="text-gray-600">
                    {formatDate(post.lastSeenDate)}
                  </p>
                </div>
              )}

              {/* Location */}
              {post.location && post.location.coordinates && (
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Location
                  </h2>
                  {post.location.address && (
                    <p className="text-gray-600 mb-4">
                      {post.location.address}
                    </p>
                  )}
                  {post.location.description && (
                    <p className="text-gray-600 mb-4">
                      {post.location.description}
                    </p>
                  )}

                  {/* Leaflet Map */}
                  <div
                    style={mapContainerStyle}
                    className="rounded-md overflow-hidden"
                  >
                    <LeafletMap
                      center={{
                        lat: post.location.coordinates[1],
                        lng: post.location.coordinates[0],
                      }}
                      marker={post.location.coordinates}
                      onMapClick={() => {}} // Read-only map, no click handler needed
                    />
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Contact Information
                </h2>
                <p className="text-gray-600">
                  <span className="font-medium">Name:</span>{" "}
                  {post.contactName || post.userId.name}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Phone:</span>{" "}
                  {post.contactPhone || post.userId.phone || "Not provided"}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span>{" "}
                  {post.contactEmail || post.userId.email}
                </p>
              </div>

              {/* Comments */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Comments ({post.comments?.length || 0})
                </h2>

                {/* Comment Form */}
                {user && post.status === "active" && (
                  <form onSubmit={handleCommentSubmit} className="mb-6">
                    <div className="mb-4">
                      <label
                        htmlFor="comment"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Add a comment
                      </label>
                      <textarea
                        id="comment"
                        ref={commentInputRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Write your comment here..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? "Submitting..." : "Submit Comment"}
                    </button>
                  </form>
                )}

                {/* Comments List */}
                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-4">
                    {post.comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            {comment.user.profileImage ? (
                              <img
                                src={comment.user.profileImage}
                                alt={comment?.user?.name?.charAt(0) ?? "?"}
                                className="w-8 h-8 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <span className="text-gray-500">
                                  {comment?.user?.name?.charAt(0) ?? "?"}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {comment?.user?.name ?? "?"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                              </p>
                            </div>
                          </div>
                          {comment.user.role === "vet" && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              Vet
                            </span>
                          )}
                          {comment.user.role === "admin" && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 whitespace-pre-line">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No comments yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">
                Post not found or has been removed.
              </p>
              <Link
                href="/posts"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800"
              >
                Return to Posts
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PostDetail;
