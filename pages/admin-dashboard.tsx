// pages/admin-dashboard.tsx
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Notification from "@/components/Notification";
import CreateAdminModal from "@/components/CreateAdminModal";

interface User {
  _id: string;
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
  total: number;
  missing: number;
  emergency: number;
  wounded: number;
  active: number;
  resolved: number;
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
    totalActive: 0
  });
  
  const [postStats, setPostStats] = useState<PostStats>({
    total: 0,
    missing: 0,
    emergency: 0,
    wounded: 0,
    active: 0,
    resolved: 0
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "admin") {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    console.log("User state changed:", { user: user?.role, loading });
    if (user?.role === "admin") {
      console.log("User is admin, fetching data...");
      fetchUsers();
      // Temporarily disable post stats to avoid 401 error
      // setTimeout(() => {
      //   fetchPostStats();
      // }, 100);
    }
  }, [user]);

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({
      message,
      type,
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      console.log("Fetching users...");
      // Fetch users with complete statistics
      const response = await axios.get("/api/admin/users", {
        withCredentials: true
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
  
  // Fetch post statistics
  const fetchPostStats = async () => {
    try {
      console.log("Fetching post stats...");
      console.log("Current user:", user);
      
      // Test with a simple request first
      try {
        const testResponse = await axios.get("/api/auth/me", {
          withCredentials: true
        });
        console.log("Auth test response:", testResponse.data);
      } catch (testError) {
        console.error("Auth test failed:", testError);
      }
      
      const response = await axios.get("/api/admin/posts/stats", {
        withCredentials: true
      });
      console.log("Post stats response:", response.data);
      setPostStats(response.data);
    } catch (error: unknown) {
      console.error("Error fetching post stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch post statistics";
      const axiosError = error as { response?: { data?: { message?: string } } };
      showNotification(axiosError.response?.data?.message || errorMessage, "error");
    }
  };
  
  // Enhanced Quick Actions Section
  const renderQuickActions = () => {
    return (
      <div className="group bg-white rounded-3xl shadow-2xl p-8 mb-12 border-4 border-gray-200 hover:border-black transition-all duration-300">
        <h2 className="text-3xl font-bold text-black mb-8 flex items-center group-hover:text-primary transition-colors duration-300">
          <svg className="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/posts" className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1">
            <span className="relative z-10 font-bold">Manage Pet Posts</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link href="/posts" className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1">
            <span className="relative z-10 font-bold">View All Posts</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link href="/posts?postType=emergency" className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1">
            <span className="relative z-10 font-bold">Emergency Posts</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link href="/posts?postType=missing" className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1">
            <span className="relative z-10 font-bold">Missing Pet Posts</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      </div>
    );
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await axios.put("/api/admin/block-user", {
        userId,
        isBlocked,
        blockReason: isBlocked ? blockReason : ""
      });
      
      setShowBlockModal(false);
      setBlockReason("");
      fetchUsers();
      showNotification(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, "success");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update user status";
      const axiosError = error as { response?: { data?: { error?: string } } };
      showNotification(axiosError.response?.data?.error || errorMessage, "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete("/api/admin/delete-user", { data: { userId } });
      fetchUsers();
      showNotification("User deleted successfully", "success");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      const axiosError = error as { response?: { data?: { error?: string } } };
      showNotification(axiosError.response?.data?.error || errorMessage, "error");
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
      const errorMessage = error instanceof Error ? error.message : "Failed to update user";
      const axiosError = error as { response?: { data?: { error?: string } } };
      showNotification(axiosError.response?.data?.error || errorMessage, "error");
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
    switch (activeTab) {
      case "users":
        return users.users;
      case "vets":
        return users.vets;
      case "admins":
        return users.admins;
      case "blocked":
        return users.blocked;
      default:
        return getAllUsers();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-black via-gray-800 to-black text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5"></div>
        <div className="max-w-7xl mx-auto px-4 py-12 relative">
          <div className="flex items-center justify-between">
            <div className="group">
              <h1 className="text-5xl font-bold tracking-wide mb-3 group-hover:scale-105 transition-transform duration-300 font-display">Admin Dashboard</h1>
              <p className="text-white text-opacity-90 text-xl font-body">Welcome back, <span className="text-primary">{user.name}</span></p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="group relative inline-flex items-center justify-center px-6 py-3 text-black bg-white border-2 border-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold group-hover:text-white">Create Admin</span>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <Link
                href="/profile"
                className="group relative inline-flex items-center justify-center px-6 py-3 text-white bg-black border-2 border-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold">My Profile</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/"
                className="group relative inline-flex items-center justify-center px-6 py-3 text-black bg-white border-2 border-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold group-hover:text-white">Home</span>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced User Stats Cards */}
        <h2 className="text-3xl font-bold text-black mb-8 flex items-center">
          <svg className="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          User Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">Total Users</p>
                <p className="text-4xl font-bold text-black">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">Veterinarians</p>
                <p className="text-4xl font-bold text-black">{stats.totalVets}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">Administrators</p>
                <p className="text-4xl font-bold text-black">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">Active Users</p>
                <p className="text-4xl font-bold text-black">{stats.totalActive}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">Blocked Users</p>
                <p className="text-4xl font-bold text-black">{stats.totalBlocked}</p>
              </div>
            </div>
          </div>
        </div>
        
                 {/* Post Stats Cards */}
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl font-bold text-gray-800">Pet Post Statistics</h2>
           <button
             onClick={fetchPostStats}
             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
           >
             Refresh Stats
           </button>
         </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{postStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Missing Pets</p>
                <p className="text-2xl font-semibold text-gray-900">{postStats.missing}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emergency</p>
                <p className="text-2xl font-semibold text-gray-900">{postStats.emergency}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-pink-100 rounded-full">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wounded</p>
                <p className="text-2xl font-semibold text-gray-900">{postStats.wounded}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">{postStats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900">{postStats.resolved}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        {renderQuickActions()}

        {/* User Management Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "all", label: "All Users", count: users.total },
                { id: "users", label: "Pet Owners", count: users.users.length },
                { id: "vets", label: "Veterinarians", count: users.vets.length },
                { id: "admins", label: "Administrators", count: users.admins.length },
                { id: "blocked", label: "Blocked Users", count: users.blocked.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
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
                    <tr key={user._id} className="hover:bg-gray-50">
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
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "admin" ? "bg-red-100 text-red-800" :
                          user.role === "vet" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}>
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
                             className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                           >
                             <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                             </svg>
                             View
                           </button>
                           <button
                             onClick={() => {
                               setSelectedUser(user);
                               setShowBlockModal(true);
                             }}
                             className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                               user.isBlocked 
                                 ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" 
                                 : "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                             }`}
                           >
                             <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                             </svg>
                             {user.isBlocked ? "Unblock" : "Block"}
                           </button>
                           <button
                             onClick={() => handleDeleteUser(user._id)}
                             className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                           >
                             <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                             Delete
                           </button>
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    defaultValue={selectedUser.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    defaultValue={selectedUser.role}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="vet">Veterinarian</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.phone || ""}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.address || ""}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => setSelectedUser({...selectedUser, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    defaultValue={selectedUser.bio || ""}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    onChange={(e) => setSelectedUser({...selectedUser, bio: e.target.value})}
                  />
                </div>
              </div>
                             <div className="flex justify-end space-x-3 mt-6">
                 <button
                   onClick={() => {
                     setShowUserModal(false);
                     setSelectedUser(null);
                   }}
                   className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => handleUpdateUser(selectedUser._id, selectedUser)}
                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
                  : `Are you sure you want to block ${selectedUser.name}?`
                }
              </p>
              {!selectedUser.isBlocked && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Block Reason</label>
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
                   className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => handleBlockUser(selectedUser._id, !selectedUser.isBlocked)}
                   className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                     selectedUser.isBlocked 
                       ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                       : "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                   }`}
                 >
                   {selectedUser.isBlocked ? "Unblock" : "Block"}
                 </button>
               </div>
            </div>
          </div>
                 </div>
       )}

       {/* Create Admin Modal */}
       <CreateAdminModal
         isOpen={showCreateAdminModal}
         onClose={() => setShowCreateAdminModal(false)}
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