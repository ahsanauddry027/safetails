// pages/index.tsx
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Hero Section */}
      <div className="text-center py-16 px-8">
        <h1 className="text-5xl font-bold mb-6 text-gray-800">
          Welcome to SafeTails 🐾
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Report, Rescue, and Rehome Pets in Need. Join our community of pet lovers and professionals.
        </p>
        
        {!user ? (
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Welcome back, {user.name}! 👋
            </h2>
            <div className="space-y-3">
              <Link
                href="/profile"
                className="block w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center"
              >
                View Profile
              </Link>
              
              {user.role === "vet" && (
                <Link
                  href="/vet-dashboard"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center"
                >
                  Vet Dashboard
                </Link>
              )}
              
              {user.role === "admin" && (
                <Link
                  href="/admin-dashboard"
                  className="block w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center"
                >
                  Admin Panel
                </Link>
              )}
              
              <Link
                href="/create-post"
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center"
              >
                Create Pet Post
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="py-16 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            How SafeTails Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Report</h3>
              <p className="text-gray-600">
                Report lost pets or animals in need of help in your area.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Rescue</h3>
              <p className="text-gray-600">
                Connect with veterinarians and rescue organizations for immediate assistance.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Rehome</h3>
              <p className="text-gray-600">
                Find loving homes for rescued animals through our community network.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Pet Posts</h3>
              <p className="text-gray-600">
                Create and share posts about pets with location pinning to help find them quickly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific sections */}
      {user && (
        <div className="py-16 px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {user.role === "vet" && (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                  Veterinarian Features
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Access your specialized dashboard to manage pet cases, provide consultations, and coordinate rescue efforts.
                </p>
                <Link
                  href="/vet-dashboard"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Access Vet Dashboard
                </Link>
              </div>
            )}
            
            {user.role === "admin" && (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                  Admin Panel
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Manage users, monitor system activity, and oversee the SafeTails platform.
                </p>
                <Link
                  href="/admin-dashboard"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Access Admin Panel
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
