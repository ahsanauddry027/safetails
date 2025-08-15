// pages/profile.tsx
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner"></div>
        <p className="ml-4 text-gray-600 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "vet":
        return "bg-black text-white";
      case "admin":
        return "bg-black text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Enhanced Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200 hover:border-black transition-all duration-300 animate-fade-in">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-black via-gray-800 to-black px-8 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5"></div>
            <div className="relative flex items-center space-x-6">
              <div className="group relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-black shadow-2xl group-hover:scale-110 transition-all duration-300 border-4 border-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/40 transition-all duration-300"></div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                  {user.name}
                </h1>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getRoleBadgeColor(user.role)} shadow-lg hover:scale-105 transition-all duration-300`}>
                  <span className="mr-2">
                    {user.role === "vet" ? "🏥" : user.role === "admin" ? "👑" : "👤"}
                  </span>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Profile Content */}
          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Personal Information */}
              <div className="group">
                <h2 className="text-2xl font-bold mb-6 text-black flex items-center group-hover:text-primary transition-colors duration-300">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h2>
                <div className="space-y-6">
                  <div className="group/item bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-gray-200">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
                    <p className="text-lg text-black font-medium">{user.email}</p>
                  </div>
                  
                  {user.phone && (
                    <div className="group/item bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-gray-200">
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Phone</label>
                      <p className="text-lg text-black font-medium">{user.phone}</p>
                    </div>
                  )}
                  
                  {user.address && (
                    <div className="group/item bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-gray-200">
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Address</label>
                      <p className="text-lg text-black font-medium">{user.address}</p>
                    </div>
                  )}
                  
                  {user.bio && (
                    <div className="group/item bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-gray-200">
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Bio</label>
                      <p className="text-lg text-black font-medium leading-relaxed">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="group">
                <h2 className="text-2xl font-bold mb-6 text-black flex items-center group-hover:text-primary transition-colors duration-300">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Account Information
                </h2>
                <div className="space-y-6">
                  <div className="group/item bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-gray-200">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Member Since</label>
                    <p className="text-lg text-black font-medium">
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="group/item bg-gray-50 p-6 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-gray-200">
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Account Status</label>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Active
                    </span>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="mt-8 space-y-4">
                  <Link
                    href="/edit-profile"
                    className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                  >
                    <span className="relative z-10 font-bold text-lg">Edit Profile</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </Link>
                  
                  {user.role === "vet" && (
                    <Link
                      href="/vet-dashboard"
                      className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                    >
                      <span className="relative z-10 font-bold text-lg">Vet Dashboard</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Link>
                  )}
                  
                  {user.role === "admin" && (
                    <Link
                      href="/admin-dashboard"
                      className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                    >
                      <span className="relative z-10 font-bold text-lg">Admin Panel</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Link>
                  )}
                  
                  <Link
                    href="/delete-profile"
                    className="group relative block w-full text-center px-6 py-4 text-white bg-red-600 border-2 border-red-600 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-red-700 hover:bg-red-700 transform hover:-translate-y-1"
                  >
                    <span className="relative z-10 font-bold text-lg">Delete Profile</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 