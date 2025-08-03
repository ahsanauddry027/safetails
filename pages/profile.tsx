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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "vet":
        return "bg-blue-100 text-blue-800";
      case "admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-yellow-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-800">{user.email}</p>
                  </div>
                  
                  {user.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-800">{user.phone}</p>
                    </div>
                  )}
                  
                  {user.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-800">{user.address}</p>
                    </div>
                  )}
                  
                  {user.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Bio</label>
                      <p className="text-gray-800">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Member Since</label>
                    <p className="text-gray-800">
                      {new Date().toLocaleDateString()} {/* You can add createdAt to user model */}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Account Status</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                  <Link
                    href="/edit-profile"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center block"
                  >
                    Edit Profile
                  </Link>
                  
                  {user.role === "vet" && (
                    <Link
                      href="/vet-dashboard"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center block"
                    >
                      Vet Dashboard
                    </Link>
                  )}
                  
                  {user.role === "admin" && (
                    <Link
                      href="/admin-dashboard"
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center block"
                    >
                      Admin Panel
                    </Link>
                  )}
                  
                  <Link
                    href="/delete-profile"
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center block"
                  >
                    Delete Profile
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