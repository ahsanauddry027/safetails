// pages/admin-dashboard.tsx
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Notification from "@/components/Notification";

import CommentManagement from "@/components/CommentManagement";
import AdminManagement from "@/components/AdminManagement";
import AdminOverview from "@/components/AdminOverview";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  bio?: string;
  isBlocked: boolean;
  blockedBy?: { name: string; email: string };
  blockedAt?: string;
  blockReason?: string;
  createdAt: string;
  isActive: boolean;
}

interface UserStats {
  totalUsers: number;
  totalVets: number;
  totalAdmins: number;
  totalBlocked: number;
  totalActive: number;
}

interface PostStats {
  petPosts: { total: number };
  fosterPosts: { total: number };
  adoptionPosts: { total: number };
  vetDirectory: { total: number };
  alerts: { total: number };
  overall: { totalPosts: number };
}

interface Report {
  _id: string;
  postId: {
    _id: string;
    title: string;
    images: string[];
  };
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved";
  adminNotes?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<{
    users: User[];
    vets: User[];
    admins: User[];
    blocked: User[];
    total: number;
  }>({ users: [], vets: [], admins: [], blocked: [], total: 0 });
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalVets: 0,
    totalAdmins: 0,
    totalBlocked: 0,
    totalActive: 0,
  });

  const [postStats, setPostStats] = useState<PostStats>({
    petPosts: { total: 0 },
    fosterPosts: { total: 0 },
    adoptionPosts: { total: 0 },
    vetDirectory: { total: 0 },
    alerts: { total: 0 },
    overall: { totalPosts: 0 },
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [showCommentManagement, setShowCommentManagement] = useState(false);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilters, setUserFilters] = useState({
    role: "",
    status: "",
    dateRange: "",
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "admin") {
      console.error("❌ User is not admin:", {
        userId: user?.id,
        userRole: user?.role,
        userEmail: user?.email,
      });
      showNotification(
        `Access denied. Your role is: ${user?.role}. Admin role required.`,
        "error"
      );
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    console.log("🔍 User state changed:", {
      userId: user?.id,
      userRole: user?.role,
      userEmail: user?.email,
      loading,
      isAdmin: user?.role === "admin",
    });

    if (user?.role === "admin") {
      console.log("✅ User is admin, fetching data...");
      console.log("🔍 Starting data fetch operations...");

      // Fetch data with error handling
      Promise.allSettled([
        fetchUsers().catch((err) =>
          console.error("❌ Failed to fetch users:", err)
        ),
        fetchPostStats().catch((err) =>
          console.error("❌ Failed to fetch post stats:", err)
        ),
        fetchReports().catch((err) =>
          console.error("❌ Failed to fetch reports:", err)
        ),
      ]).then((results) => {
        console.log(
          "📊 Data fetch results:",
          results.map((result, index) => ({
            operation: ["users", "postStats", "reports"][index],
            status: result.status,
            error: result.status === "rejected" ? result.reason : null,
          }))
        );
      });
    } else {
      console.log("❌ User is not admin, cannot fetch data");
    }
  }, [user]);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotification({
      message,
      type,
      isVisible: true,
    });
  };

  // Enhanced error handling function
  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (axiosError.response?.status === 401) {
        return "Session expired. Please login again.";
      }
      if (axiosError.response?.status === 403) {
        return "Insufficient permissions.";
      }
      if (axiosError.response?.status === 404) {
        return "Resource not found.";
      }
      if (axiosError.response?.status === 409) {
        return "Conflict: Resource already exists.";
      }
      if (axiosError.response?.status === 422) {
        return "Invalid data provided.";
      }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return "Server error. Please try again later.";
      }
      return (
        axiosError.response?.data?.message || "An unexpected error occurred."
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred.";
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      console.log("Fetching users...");
      // Fetch users with complete statistics
      const response = await axios.get("/api/admin/users", {
        withCredentials: true,
      });
      console.log("Users response:", response.data);
      setUsers(response.data.users);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showNotification("Failed to fetch users", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch comprehensive post statistics
  const fetchPostStats = async () => {
    try {
      setRefreshingStats(true);
      console.log("Fetching post stats...");

      // Check if user is authenticated and is admin
      if (!user || user.role !== "admin") {
        showNotification("Authentication required", "error");
        return;
      }

      // Fetch statistics from all post types
      const [petStats, fosterStats, adoptionStats, vetStats, alertStats] =
        await Promise.all([
          axios.get("/api/admin/posts/stats", { withCredentials: true }),
          axios.get("/api/admin/foster/stats", { withCredentials: true }),
          axios.get("/api/admin/adoption/stats", { withCredentials: true }),
          axios.get("/api/admin/vet-directory/stats", {
            withCredentials: true,
          }),
          axios.get("/api/admin/alerts/stats", { withCredentials: true }),
        ]);

      // Combine all statistics - only total counts
      const comprehensiveStats: PostStats = {
        petPosts: { total: petStats.data.total || 0 },
        fosterPosts: { total: fosterStats.data.total || 0 },
        adoptionPosts: { total: adoptionStats.data.total || 0 },
        vetDirectory: { total: vetStats.data.total || 0 },
        alerts: { total: alertStats.data.total || 0 },
        overall: { totalPosts: 0 },
      };

      // Calculate overall total
      comprehensiveStats.overall.totalPosts =
        comprehensiveStats.petPosts.total +
        comprehensiveStats.fosterPosts.total +
        comprehensiveStats.adoptionPosts.total +
        comprehensiveStats.vetDirectory.total +
        comprehensiveStats.alerts.total;

      console.log("Post stats:", comprehensiveStats);
      setPostStats(comprehensiveStats);
      showNotification("Post statistics updated successfully", "success");
    } catch (error: unknown) {
      console.error("Error fetching post stats:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };

        if (axiosError.response?.status === 401) {
          showNotification(
            "Authentication expired. Please log in again.",
            "error"
          );
          router.push("/login");
        } else if (axiosError.response?.status === 403) {
          showNotification(
            "Access denied. Admin privileges required.",
            "error"
          );
        } else {
          const errorMessage =
            axiosError.response?.data?.message ||
            "Failed to fetch comprehensive statistics";
          showNotification(errorMessage, "error");
        }
      } else {
        showNotification("Failed to fetch comprehensive statistics", "error");
      }
    } finally {
      setRefreshingStats(false);
    }
  };

  // Fetch reports for content review
  const fetchReports = async (page = 1) => {
    try {
      setReportsLoading(true);
      console.log("🔍 Fetching reports for page:", page);

      // Use admin reports endpoint instead of public reports endpoint
      const response = await axios.get(
        `/api/admin/reports?page=${page}&limit=10`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setReports(response.data.data);
        setReportsTotalPages(response.data.pagination.totalPages);
        setReportsTotal(response.data.pagination.total);
        setReportsPage(page);
        console.log(
          "✅ Reports fetched successfully:",
          response.data.data.length
        );
      }
    } catch (error: unknown) {
      console.error("❌ Error fetching reports:", error);

      // Type-safe error handling
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: { message?: string };
          };
          message?: string;
        };

        console.error("❌ Error details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message,
        });

        if (axiosError.response?.status === 403) {
          showNotification(
            "Access denied. You don't have permission to view reports. Please check your admin role.",
            "error"
          );
        } else {
          showNotification(
            `Failed to fetch reports: ${getErrorMessage(error)}`,
            "error"
          );
        }
      } else {
        console.error("❌ Unknown error type:", error);
        showNotification(
          `Failed to fetch reports: ${getErrorMessage(error)}`,
          "error"
        );
      }
    } finally {
      setReportsLoading(false);
    }
  };

  const handleReportStatusUpdate = async (reportId: string, status: string) => {
    try {
      console.log("🔍 handleReportStatusUpdate called with:", {
        reportId,
        status,
        user,
      });
      console.log("🔍 User object structure:", {
        hasId: !!user?.id,
        hasUnderscoreId: !!(user && (user as { _id?: string })._id),
        idValue: user?.id,
        underscoreIdValue: (user as Partial<User> & { _id?: string })?._id,
        userKeys: user ? Object.keys(user) : [],
      });

      // Check for user authentication with better debugging
      if (!user) {
        console.error("❌ User object is null or undefined");
        throw new Error("User not authenticated - user object is null");
      }

      // Get the user ID from the user object - try both id and _id in a type-safe way
      const userId =
        user.id ||
        (typeof (user as { _id?: string })._id === "string"
          ? (user as { _id?: string })._id
          : undefined);
      if (!userId) {
        console.error("❌ User ID not found in user object:", user);
        throw new Error("User not authenticated - user ID not found");
      }

      console.log("✅ User authenticated, proceeding with ID:", userId);

      // Use admin reports update endpoint instead of public reports endpoint
      const response = await axios.put(
        `/api/admin/reports/${reportId}`,
        {
          status,
          reviewedBy: userId,
        },
        {
          withCredentials: true,
        }
      );

      // Refresh the reports list to show updated status
      await fetchReports(reportsPage);
      showNotification(`Report marked as ${status} successfully`, "success");

      return response.data;
    } catch (error) {
      console.error("❌ Failed to update report:", error);
      showNotification(getErrorMessage(error), "error");
      throw error;
    }
  };

  const handlePostAction = async (
    reportId: string,
    postId: string,
    action: "approve" | "delete"
  ) => {
    try {
      console.log("🔍 Handling post action:", { reportId, postId, action });

      // Validate inputs and user authentication
      if (!reportId || !postId) {
        showNotification("Invalid report or post ID", "error");
        return;
      }

      if (!user) {
        showNotification("User not authenticated", "error");
        return;
      }

      console.log("🔍 User object in handlePostAction:", {
        hasId: !!user?.id,
        hasUnderscoreId: !!(user as Partial<User> & { _id?: string })?._id,
        idValue: user?.id,
        underscoreIdValue: (user as Partial<User> & { _id?: string })?._id,
      });

      if (action === "approve") {
        // Approve the post - mark report as resolved
        await axios.put(
          `/api/admin/reports/${reportId}`,
          {
            status: "resolved",
            reviewedBy: user.id,
            adminNotes: "Post approved and kept",
          },
          {
            withCredentials: true,
          }
        );

        showNotification("Post approved and kept successfully", "success");
      } else if (action === "delete") {
        try {
          // Delete the post
          await axios.delete(`/api/admin/posts/${postId}`);

          // Mark report as resolved
          await axios.put(
            `/api/admin/reports/${reportId}`,
            {
              status: "resolved",
              reviewedBy: user.id,
              adminNotes: "Post deleted due to violation",
            },
            {
              withCredentials: true,
            }
          );

          showNotification("Post deleted successfully", "success");
        } catch (deleteError: unknown) {
          if (
            deleteError &&
            typeof deleteError === "object" &&
            "response" in deleteError &&
            deleteError.response &&
            typeof deleteError.response === "object" &&
            "status" in deleteError.response &&
            deleteError.response.status === 404
          ) {
            // Post was already deleted, just mark report as resolved
            await axios.put(
              `/api/admin/reports/${reportId}`,
              {
                status: "resolved",
                reviewedBy: user.id,
                adminNotes: "Post was already deleted",
              },
              {
                withCredentials: true,
              }
            );
            showNotification(
              "Post was already deleted, report marked as resolved",
              "info"
            );
          } else {
            throw deleteError; // Re-throw other errors
          }
        }
      }

      // Refresh the reports list
      await fetchReports(reportsPage);
    } catch (error) {
      console.error("❌ Error handling post action:", error);
      showNotification(
        `Failed to ${action} post: ${getErrorMessage(error)}`,
        "error"
      );
    }
  };

  // Clear all reports function
  const clearAllReports = async () => {
    try {
      if (!user) {
        showNotification("User not authenticated", "error");
        return;
      }

      // Delete all reports permanently from the database
      const deletePromises = reports.map(async (report) => {
        try {
          await axios.delete(`/api/admin/reports/${report._id}`, {
            withCredentials: true,
          });
        } catch (error) {
          console.error(`Failed to delete report ${report._id}:`, error);
          // Continue with other reports even if one fails
        }
      });

      await Promise.allSettled(deletePromises);

      // Clear the local reports state
      setReports([]);
      setReportsTotal(0);
      setReportsTotalPages(1);
      setReportsPage(1);

      showNotification(
        "All reports have been permanently deleted from the database",
        "success"
      );
    } catch (error) {
      console.error("❌ Error clearing all reports:", error);
      showNotification(
        `Failed to clear all reports: ${getErrorMessage(error)}`,
        "error"
      );
    }
  };

  // Enhanced Quick Actions Section
  const renderQuickActions = () => {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12 border-4 border-gray-200">
        <h2 className="text-3xl font-bold text-black mb-8 flex items-center">
          <svg
            className="w-8 h-8 mr-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/posts"
            className="block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer hover:bg-gray-800 transition-colors"
          >
            Manage Pet Posts
          </Link>
          <Link
            href="/admin/foster"
            className="block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer hover:bg-gray-800 transition-colors"
          >
            Manage Foster Posts
          </Link>
          <Link
            href="/admin/adoption"
            className="block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer hover:bg-gray-800 transition-colors"
          >
            Manage Adoption Posts
          </Link>
          <Link
            href="/admin/vet-directory"
            className="block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer hover:bg-gray-800 transition-colors"
          >
            Manage Vet Directory
          </Link>
          <Link
            href="/admin/alerts"
            className="block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer hover:bg-gray-800 transition-colors"
          >
            Manage Alerts
          </Link>
          <Link
            href="/posts"
            className="block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer hover:bg-gray-800 transition-colors"
          >
            View All Posts
          </Link>
        </div>
      </div>
    );
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      console.log("Attempting to block/unblock user:", {
        userId,
        isBlocked,
        blockReason: isBlocked ? blockReason : "",
      });

      const response = await axios.put("/api/admin/block-user", {
        userId,
        isBlocked,
        blockReason: isBlocked ? blockReason : "",
      });

      console.log("Block user response:", response.data);

      setShowBlockModal(false);
      setBlockReason("");
      fetchUsers();
      showNotification(
        `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
        "success"
      );
    } catch (error: unknown) {
      console.error("Block user error:", error);

      // Enhanced error handling
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { error?: string; message?: string; details?: string };
          };
        };

        console.error("Block user API error details:", {
          status: axiosError.response?.status,
          error: axiosError.response?.data?.error,
          message: axiosError.response?.data?.message,
          details: axiosError.response?.data?.details,
        });

        const errorMessage =
          axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          getErrorMessage(error);
        showNotification(errorMessage, "error");
      } else {
        showNotification(getErrorMessage(error), "error");
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete("/api/admin/delete-user", { data: { userId } });
      fetchUsers();
      showNotification("User deleted successfully", "success");
    } catch (error: unknown) {
      showNotification(getErrorMessage(error), "error");
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await axios.put("/api/admin/update-user", { userId, ...userData });
      setShowUserModal(false);
      setSelectedUser(null);
      fetchUsers();
      showNotification("User updated successfully", "success");
    } catch (error: unknown) {
      showNotification(getErrorMessage(error), "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner"></div>
        <p className="ml-4 text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const getAllUsers = () => {
    return [...users.users, ...users.vets, ...users.admins];
  };

  const getFilteredUsers = () => {
    let filteredUsers = [];

    // First filter by tab
    switch (activeTab) {
      case "users":
        filteredUsers = users.users;
        break;
      case "vets":
        filteredUsers = users.vets;
        break;
      case "admins":
        filteredUsers = users.admins;
        break;
      case "blocked":
        filteredUsers = users.blocked;
        break;
      default:
        filteredUsers = getAllUsers();
    }

    // Then apply search filter
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (userFilters.role) {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === userFilters.role
      );
    }

    // Apply status filter
    if (userFilters.status) {
      if (userFilters.status === "active") {
        filteredUsers = filteredUsers.filter((user) => !user.isBlocked);
      } else if (userFilters.status === "blocked") {
        filteredUsers = filteredUsers.filter((user) => user.isBlocked);
      }
    }

    // Apply date range filter
    if (userFilters.dateRange) {
      const now = new Date();

      switch (userFilters.dateRange) {
        case "today":
          filteredUsers = filteredUsers.filter((user: User) => {
            const userDate = new Date(user.createdAt);
            return userDate.toDateString() === now.toDateString();
          });
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredUsers = filteredUsers.filter((user: User) => {
            const userDate = new Date(user.createdAt);
            return userDate >= weekAgo;
          });
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredUsers = filteredUsers.filter((user: User) => {
            const userDate = new Date(user.createdAt);
            return userDate >= monthAgo;
          });
          break;
      }
    }

    return filteredUsers;
  };

  const clearUserFilters = () => {
    setSearchTerm("");
    setUserFilters({
      role: "",
      status: "",
      dateRange: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-black via-gray-800 to-black text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="flex items-center justify-between">
            <div className="group">
              <h1 className="text-6xl font-bold tracking-tight group-hover:scale-105 transition-all duration-500 font-display bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setShowCommentManagement(true)}
                className="px-8 py-4 text-white bg-black border-2 border-white rounded-2xl font-bold text-lg"
              >
                Manage Comments
              </button>
              <Link
                href="/create-admin"
                className="px-8 py-4 text-white bg-black border-2 border-white rounded-2xl font-bold text-lg"
              >
                Create Admin
              </Link>
              <button
                onClick={() => setShowAdminManagement(true)}
                className="px-8 py-4 text-white bg-black border-2 border-white rounded-2xl font-bold text-lg"
              >
                Manage Admins
              </button>
              <Link
                href="/profile"
                className="px-8 py-4 text-white bg-black border-2 border-white rounded-2xl font-bold text-lg"
              >
                My Profile
              </Link>
              <Link
                href="/"
                className="px-8 py-4 text-white bg-black border-2 border-white rounded-2xl font-bold text-lg"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Overview Section */}
        <AdminOverview onRefresh={fetchUsers} />

        {/* Enhanced User Stats Cards */}
        <h2 className="text-3xl font-bold text-black mb-8 flex items-center">
          <svg
            className="w-8 h-8 mr-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          User Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600">
                  Total Users
                </p>
                <p className="text-4xl font-bold text-black">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600">Vets</p>
                <p className="text-4xl font-bold text-black">
                  {stats.totalVets}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600">Admins</p>
                <p className="text-4xl font-bold text-black">
                  {stats.totalAdmins}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600">
                  Active Users
                </p>
                <p className="text-4xl font-bold text-black">
                  {stats.totalActive}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                  />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600">
                  Blocked Users
                </p>
                <p className="text-4xl font-bold text-black">
                  {stats.totalBlocked}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Post Stats Cards */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Post Statistics</h2>
          <button
            onClick={() => {
              // Add a small delay to ensure authentication is ready
              setTimeout(() => fetchPostStats(), 100);
            }}
            disabled={refreshingStats}
            className={`px-4 py-2 text-white rounded-md cursor-pointer ${
              refreshingStats
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {refreshingStats ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </div>
            ) : (
              "Refresh Stats"
            )}
          </button>
        </div>
        {/* Post Statistics - Total Numbers Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Pet Posts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pet Posts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {postStats.petPosts.total}
                </p>
              </div>
            </div>
          </div>

          {/* Foster Posts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Foster Posts
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {postStats.fosterPosts.total}
                </p>
              </div>
            </div>
          </div>

          {/* Adoption Posts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Adoption Posts
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {postStats.adoptionPosts.total}
                </p>
              </div>
            </div>
          </div>

          {/* Vet Directory */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Vet Directory
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {postStats.vetDirectory.total}
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {postStats.alerts.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* User Management Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                User Management
              </h2>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className={`px-4 py-2 text-white rounded-md cursor-pointer ${
                  loadingUsers
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loadingUsers ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Refreshing...
                  </div>
                ) : (
                  "Refresh Users"
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "all", label: "All Users", count: users.total },
                { id: "users", label: "Pet Owners", count: users.users.length },
                {
                  id: "vets",
                  label: "Veterinarians",
                  count: users.vets.length,
                },
                {
                  id: "admins",
                  label: "Administrators",
                  count: users.admins.length,
                },
                {
                  id: "blocked",
                  label: "Blocked Users",
                  count: users.blocked.length,
                },
                {
                  id: "reports",
                  label: "Content Review",
                  count: reportsTotal,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Users
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Role Filter */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={userFilters.role}
                  onChange={(e) =>
                    setUserFilters({ ...userFilters, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="vet">Veterinarian</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={userFilters.status}
                  onChange={(e) =>
                    setUserFilters({ ...userFilters, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Date Range Filter */}
              <div>
                <label
                  htmlFor="dateRange"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date Range
                </label>
                <select
                  id="dateRange"
                  value={userFilters.dateRange}
                  onChange={(e) =>
                    setUserFilters({
                      ...userFilters,
                      dateRange: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearUserFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing {getFilteredUsers().length} of {getAllUsers().length}{" "}
              users
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredUsers().map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : user.role === "vet"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isBlocked
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBlockModal(true);
                            }}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${
                              user.isBlocked
                                ? "bg-green-600 focus:ring-green-500"
                                : "bg-yellow-600 focus:ring-yellow-500"
                            }`}
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            {user.isBlocked ? "Unblock" : "Block"}
                          </button>
                          {user.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id!)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
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
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Reports Content Review Section */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-lg shadow-md mt-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Content Review - Reports
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Review and manage reported content from users
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to clear all reports? This action cannot be undone."
                      )
                    ) {
                      clearAllReports();
                    }
                  }}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
                >
                  Clear All Reports
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {reportsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No reports found.</p>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {reports.map((report) => (
                    <div
                      key={report._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Reported Post:{" "}
                            {report.postId?.title || "Unknown Post"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Reported by: {report.reportedBy?.name} (
                            {report.reportedBy?.email})
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : report.status === "reviewed"
                                ? "bg-blue-100 text-blue-800"
                                : report.status === "resolved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {report.status.charAt(0).toUpperCase() +
                            report.status.slice(1)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Reason:
                        </p>
                        <p className="text-gray-600">{report.reason}</p>
                      </div>

                      {!report.postId && (
                        <div className="mb-3">
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800 font-medium">
                              ⚠️ Post has been deleted or is no longer available
                            </p>
                          </div>
                        </div>
                      )}

                      {report.description && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Description:
                          </p>
                          <p className="text-gray-600">{report.description}</p>
                        </div>
                      )}

                      {report.adminNotes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Admin Notes:
                          </p>
                          <p className="text-gray-600 bg-gray-50 p-2 rounded border">
                            {report.adminNotes}
                          </p>
                        </div>
                      )}

                      {report.reviewedBy && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Reviewed by:
                          </p>
                          <p className="text-gray-600">
                            {report.reviewedBy.name} on{" "}
                            {new Date(
                              report.reviewedAt || ""
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {report.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleReportStatusUpdate(report._id, "reviewed")
                              }
                              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                              Mark Reviewed
                            </button>
                            <button
                              onClick={() =>
                                handleReportStatusUpdate(report._id, "resolved")
                              }
                              className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                            >
                              Mark Resolved
                            </button>
                          </>
                        )}
                        {report.postId && report.postId._id && (
                          <button
                            onClick={() =>
                              window.open(
                                `/posts/${report.postId._id}`,
                                "_blank"
                              )
                            }
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            View Post
                          </button>
                        )}
                        {report.status === "pending" &&
                          report.postId &&
                          report.postId._id && (
                            <>
                              <button
                                onClick={() =>
                                  handlePostAction(
                                    report._id,
                                    report.postId._id,
                                    "approve"
                                  )
                                }
                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                              >
                                Approve Post
                              </button>
                              <button
                                onClick={() =>
                                  handlePostAction(
                                    report._id,
                                    report.postId._id,
                                    "delete"
                                  )
                                }
                                className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                              >
                                Delete Post
                              </button>
                            </>
                          )}

                        {report.status === "pending" && !report.postId && (
                          <div className="text-sm text-gray-500 italic">
                            Post already deleted - no action needed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {reportsTotalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                      <button
                        onClick={() => fetchReports(reportsPage - 1)}
                        disabled={reportsPage === 1}
                        className={`px-3 py-1 text-sm rounded-md ${
                          reportsPage === 1
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gray-600 text-white hover:bg-gray-700"
                        }`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {reportsPage} of {reportsTotalPages}
                      </span>
                      <button
                        onClick={() => fetchReports(reportsPage + 1)}
                        disabled={reportsPage === reportsTotalPages}
                        className={`px-3 py-1 text-sm rounded-md ${
                          reportsPage === reportsTotalPages
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gray-600 text-white hover:bg-gray-700"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                User Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedUser.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={selectedUser.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    defaultValue={selectedUser.role}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                  >
                    <option value="user">User</option>
                    <option value="vet">Veterinarian</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedUser.phone || ""}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedUser.address || ""}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    defaultValue={selectedUser.bio || ""}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, bio: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedUser.id) {
                      handleUpdateUser(selectedUser.id, selectedUser);
                    } else {
                      showNotification("User ID is missing.", "error");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedUser.isBlocked ? "Unblock User" : "Block User"}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedUser.isBlocked
                  ? `Are you sure you want to unblock ${selectedUser.name}?`
                  : `Are you sure you want to block ${selectedUser.name}?`}
              </p>
              {!selectedUser.isBlocked && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block Reason
                  </label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    rows={3}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter reason for blocking this user..."
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setSelectedUser(null);
                    setBlockReason("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleBlockUser(selectedUser.id!, !selectedUser.isBlocked)
                  }
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${
                    selectedUser.isBlocked
                      ? "bg-green-600 text-white focus:ring-green-500"
                      : "bg-red-600 text-white focus:ring-red-500"
                  }`}
                >
                  {selectedUser.isBlocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Management Modal */}
      <CommentManagement
        isOpen={showCommentManagement}
        onClose={() => setShowCommentManagement(false)}
      />

      {/* Admin Management Modal */}
      <AdminManagement
        isOpen={showAdminManagement}
        onClose={() => setShowAdminManagement(false)}
        onSuccess={(message) => {
          showNotification(message, "success");
          fetchUsers(); // Refresh the user list
        }}
        onError={(message) => showNotification(message, "error")}
      />

      {/* Notification Component */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}
