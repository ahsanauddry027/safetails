// pages/index.tsx
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ImageSlider from "@/components/ImageSlider";

export default function Home() {
  const { user, loading } = useAuth();

  // Sample pet images for the slider
  const petImages = [
    {
      src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Happy dog playing in the park",
      title: "Find Your Perfect Companion",
      description: "Discover loving pets waiting for their forever homes"
    },
    {
      src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Cute cat looking at camera",
      title: "Rescue & Rehome",
      description: "Help animals in need find safety and care"
    },
    {
      src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Veterinarian with pet",
      title: "Professional Care",
      description: "Connect with qualified veterinarians and rescue organizations"
    },
    {
      src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Two dogs running together",
      title: "Community Support",
      description: "Join our network of pet lovers and professionals"
    }
  ];

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Image Slider */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Image Slider */}
          <div className="mb-16 animate-scale-in">
            <ImageSlider images={petImages} />
          </div>
          
          {/* Enhanced CTA Buttons */}
          <div className="text-center animate-fade-in">
            {!user ? (
              <div className="flex gap-6 justify-center flex-wrap">
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-black border-4 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Link>
                <Link
                  href="/login"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-white border-4 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-black hover:text-white transform hover:-translate-y-1"
                >
                  <span className="relative z-10 group-hover:text-white">Sign In</span>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Link>
              </div>
            ) : (
              <div className="card p-8 max-w-md mx-auto hover-lift">
                <h2 className="text-2xl font-bold mb-6 text-black">
                  Welcome back, <span className="text-primary">{user.name}</span>! 👋
                </h2>
                <div className="space-y-4">
                  <Link
                    href="/profile"
                    className="group relative block w-full text-center px-6 py-3 text-white bg-black border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                  >
                    <span className="relative z-10 font-semibold">View Profile</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  
                  {user.role === "vet" && (
                    <Link
                      href="/vet-dashboard"
                      className="group relative block w-full text-center px-6 py-3 text-black bg-white border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-black hover:text-white transform hover:-translate-y-1"
                    >
                      <span className="relative z-10 font-semibold group-hover:text-white">Vet Dashboard</span>
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  )}
                  
                  {user.role === "admin" && (
                    <Link
                      href="/admin-dashboard"
                      className="group relative block w-full text-center px-6 py-3 text-black bg-white border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-black hover:text-white transform hover:-translate-y-1"
                    >
                      <span className="relative z-10 font-semibold group-hover:text-white">Admin Panel</span>
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  )}
                  
                  <Link
                    href="/create-post"
                    className="group relative block w-full text-center px-6 py-3 text-white bg-green-600 border-2 border-green-600 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-green-700 hover:bg-green-700 transform hover:-translate-y-1"
                  >
                    <span className="relative z-10 font-semibold">Create Pet Post</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black group cursor-pointer">
              How <span className="text-primary relative">
                SafeTails
                <div className="absolute -bottom-2 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-500"></div>
              </span> Works
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-medium hover:text-black transition-colors duration-300">
              Our platform connects pet lovers, veterinarians, and rescue organizations to help animals in need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">📝</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">Report</h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Report lost pets or animals in need of help in your area with precise location tracking.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">🏥</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">Rescue</h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Connect with veterinarians and rescue organizations for immediate assistance and care.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">🏠</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">Rehome</h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Find loving homes for rescued animals through our trusted community network.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">📱</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">Pet Posts</h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Create and share posts about pets with location pinning to help find them quickly.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-specific sections */}
      {user && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {user.role === "vet" && (
              <div className="text-center animate-fade-in">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
                  Veterinarian <span className="text-primary">Features</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
                  Access your specialized dashboard to manage pet cases, provide consultations, and coordinate rescue efforts.
                </p>
                <Link
                  href="/vet-dashboard"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-black border-4 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                >
                  <span className="relative z-10">Access Vet Dashboard</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Link>
              </div>
            )}
            
            {user.role === "admin" && (
              <div className="text-center animate-fade-in">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
                  Admin <span className="text-primary">Panel</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
                  Manage users, monitor system activity, and oversee the SafeTails platform with comprehensive tools.
                </p>
                <Link
                  href="/admin-dashboard"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-black border-4 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                >
                  <span className="relative z-10">Access Admin Panel</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Make a <span className="text-white">Difference</span>?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto font-medium">
            Join thousands of pet lovers and professionals working together to help animals in need.
          </p>
          {!user && (
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-white border-4 border-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-200 hover:bg-gray-100 transform hover:-translate-y-1"
            >
              <span className="relative z-10">Join SafeTails Today</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-black/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
