import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

type AdoptionPost = {
  _id: string;
  petName: string;
  petType: string;
  petBreed: string;
  description: string;
  status: "available" | "pending" | "adopted";
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
};

const AdminAdoptionPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<AdoptionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/adoption", {
        withCredentials: true,
      });
      setPosts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching adoption posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this adoption post?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/adoption/${postId}`, {
        withCredentials: true,
      });
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      alert("Adoption post deleted successfully");
    } catch (error) {
      console.error("Error deleting adoption post:", error);
      alert("Failed to delete adoption post");
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">
            Adoption Posts Management
          </h1>
          <Link
            href="/admin-dashboard"
            className="px-6 py-3 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p>Loading adoption posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No adoption posts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pet Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {post.petName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.petBreed} • {post.petType}
                        </div>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            post.status === "available"
                              ? "bg-green-100 text-green-800"
                              : post.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {post.status.charAt(0).toUpperCase() +
                            post.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {post.userId.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.userId.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md active:scale-95 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700"
                          >
                            <svg
                              className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAdoptionPage;
