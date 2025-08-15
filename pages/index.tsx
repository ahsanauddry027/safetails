// pages/index.tsx
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ImageSlider from "@/components/ImageSlider";

export default function Home() {
  const { user, loading } = useAuth();

  const petImages = [
    {
      src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Happy dog playing in the park",
      title: "Find Your Perfect Companion",
      description: "Discover loving pets waiting for their forever homes",
    },
    {
      src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Cute cat looking at camera",
      title: "Rescue & Rehome",
      description: "Help animals in need find safety and care",
    },
    {
      src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Veterinarian with pet",
      title: "Professional Care",
      description:
        "Connect with qualified veterinarians and rescue organizations",
    },
    {
      src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      alt: "Two dogs running together",
      title: "Community Support",
      description: "Join our network of pet lovers and professionals",
    },
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
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-white border-4 border-black rounded-2xl overflow-hidden duration-300"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 opacity-0"></div>
                  <div className="absolute inset-0"></div>
                </Link>
              </div>
            ) : (
              <div className="card p-8 max-w-md mx-auto hover-lift">
                <h2 className="text-2xl font-bold mb-6 text-black">
                  Welcome back,{" "}
                  <span className="text-primary">{user.name}</span>! 👋
                </h2>
                <div className="space-y-4">
                  <Link
                    href="/profile"
                    className="group relative block w-full text-center px-6 py-3 text-white bg-black border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
                  >
                    <span className="relative z-10 font-semibold">
                      View Profile
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>

                  {user.role === "vet" && (
                    <Link
                      href="/vet-dashboard"
                      className="group relative block w-full text-center px-6 py-3 text-black bg-white border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-black hover:text-white transform hover:-translate-y-1"
                    >
                      <span className="relative z-10 font-semibold group-hover:text-white">
                        Vet Dashboard
                      </span>
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  )}

                  {user.role === "admin" && (
                    <Link
                      href="/admin-dashboard"
                      className="group relative block w-full text-center px-6 py-3 text-black bg-white border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-black hover:text-white transform hover:-translate-y-1"
                    >
                      <span className="relative z-10 font-semibold group-hover:text-white">
                        Admin Panel
                      </span>
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  )}

                  <Link
                    href="/create-post"
                    className="group relative block w-full text-center px-6 py-3 text-white bg-green-600 border-2 border-green-600 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-green-700 hover:bg-green-700 transform hover:-translate-y-1"
                  >
                    <span className="relative z-10 font-semibold">
                      Create Pet Post
                    </span>
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
              How{" "}
              <span className="text-primary relative">
                SafeTails
                <div className="absolute -bottom-2 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-500"></div>
              </span>{" "}
              Works
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-medium hover:text-black transition-colors duration-300">
              Our platform connects pet lovers, veterinarians, and rescue
              organizations to help animals in need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">
                  📝
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">
                Report
              </h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Report lost pets or animals in need of help in your area with
                precise location tracking.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>

            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">
                  🏥
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">
                Rescue
              </h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Connect with veterinarians and rescue organizations for
                immediate assistance and care.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>

            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">
                  🏠
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">
                Rehome
              </h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Find loving homes for rescued animals through our trusted
                community network.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>

            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 text-center hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300 group-hover:bg-gray-800 border-4 border-white">
                <span className="text-4xl text-white group-hover:scale-110 transition-transform duration-300">
                  📱
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-black group-hover:text-primary transition-colors duration-300">
                Pet Posts
              </h3>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg">
                Create and share posts about pets with location pinning to help
                find them quickly.
              </p>
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-1 bg-black mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black group cursor-pointer">
              What Our{" "}
              <span className="text-primary relative">
                Community
                <div className="absolute -bottom-2 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-500"></div>
              </span>{" "}
              Says
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-medium hover:text-black transition-colors duration-300">
              Hear from pet lovers, veterinarians, and rescue organizations who
              have made a difference.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Comment Card 1 */}
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white font-bold">S</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors duration-300">
                    Sarah Johnson
                  </h4>
                  <p className="text-gray-600 font-medium">Pet Owner</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg mb-4">
                SafeTails helped me find my lost dog within hours! The community
                support was incredible. Im forever grateful for this platform.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  2 days ago
                </span>
              </div>
            </div>

            {/* Comment Card 2 */}
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white font-bold">D</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors duration-300">
                    Dr. Michael Chen
                  </h4>
                  <p className="text-gray-600 font-medium">Veterinarian</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg mb-4">
                As a vet, I love how SafeTails connects me with pet owners in
                need. The location tracking feature is a game-changer for
                emergency cases.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  1 week ago
                </span>
              </div>
            </div>

            {/* Comment Card 3 */}
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white font-bold">E</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors duration-300">
                    Emma Rodriguez
                  </h4>
                  <p className="text-gray-600 font-medium">Rescue Volunteer</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg mb-4">
                SafeTails has revolutionized how we coordinate rescue efforts.
                The real-time updates and community alerts help us save more
                animals.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  3 days ago
                </span>
              </div>
            </div>

            {/* Comment Card 4 */}
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white font-bold">J</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors duration-300">
                    James Wilson
                  </h4>
                  <p className="text-gray-600 font-medium">Pet Owner</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg mb-4">
                Found the perfect home for my foster kitten through SafeTails.
                The vet verification system gave me peace of mind.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  5 days ago
                </span>
              </div>
            </div>

            {/* Comment Card 5 */}
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white font-bold">L</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors duration-300">
                    Lisa Thompson
                  </h4>
                  <p className="text-gray-600 font-medium">Animal Shelter</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg mb-4">
                SafeTails has increased our adoption rates by 40%. The detailed
                pet profiles and location features are fantastic.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  1 week ago
                </span>
              </div>
            </div>

            {/* Comment Card 6 */}
            <div className="group bg-white border-4 border-gray-200 rounded-3xl p-8 hover-lift animate-fade-in cursor-pointer hover:border-black transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white font-bold">R</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-black group-hover:text-gray-700 transition-colors duration-300">
                    Robert Davis
                  </h4>
                  <p className="text-gray-600 font-medium">Pet Owner</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium group-hover:text-black transition-colors duration-300 text-lg mb-4">
                The emergency contact feature saved my cats life. Within
                minutes, a vet was on the way. Thank you SafeTails!
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  2 weeks ago
                </span>
              </div>
            </div>
          </div>

          {/* Add Comment Button */}
          <div className="text-center mt-12">
            <button className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-black border-4 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1">
              <span className="relative z-10">Share Your Story</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
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
                  Access your specialized dashboard to manage pet cases, provide
                  consultations, and coordinate rescue efforts.
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
                  Manage users, monitor system activity, and oversee the
                  SafeTails platform with comprehensive tools.
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
            Join thousands of pet lovers and professionals working together to
            help animals in need.
          </p>
          {!user && (
            <Link
              href="/register"
              className=" p-4 bg-black text-white rounded-lg font-semibold border-2 border-white"
            >
              <span className="relative">Join SafeTails Today</span>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-black text-white border-2 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-black">ST</span>
                </div>
                <h3 className="text-2xl font-bold text-white">SafeTails</h3>
              </div>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Connecting pet lovers, veterinarians, and rescue organizations
                to help animals in need. Together, we make a difference in the
                lives of pets and their families.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="group w-12 h-12 bg-black text-white border-2 rounded-full flex items-center justify-center"
                >
                  <span className="text-2xl font-bold text-black">𝕏</span>
                </a>
                <a
                  href="#"
                  className="group w-12 h-12 bg-black text-white border-2 rounded-full flex items-center justify-center"
                >
                  <span className="text-2xl font-bold text-black">f</span>
                </a>
                <a
                  href="#"
                  className="group w-12 h-12 bg-black text-white border-2 rounded-full flex items-center justify-center"
                >
                  <span className="text-2xl font-bold text-black">In</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/posts"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-white rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                    Pet Posts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create-post"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-white rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                    Create Post
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-white rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vet-dashboard"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-white rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                    Vet Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contact Us
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <svg
                    className="w-5 h-5 mr-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>ahsanauddry.ndc@gmail.com</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <svg
                    className="w-5 h-5 mr-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>+8801601-580044</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <svg
                    className="w-5 h-5 mr-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>BRAC University, Dhaka</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 SafeTails. All rights reserved. Making a difference in
                pet lives.
              </p>
              <div className="flex space-x-6">
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
