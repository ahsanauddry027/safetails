// pages/vet-dashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";

// Define types
interface VetRequest {
  _id: string;
  petName: string;
  requestType: string;
  status: string;
  userId?: {
    name: string;
  };
}

interface NearbyPost {
  _id: string;
  postType: "emergency" | "wounded" | "missing";
  petName: string;
  description: string;
  location?: {
    address: string;
  };
}

interface VetConsultantPost {
  _id: string;
  petName: string;
  petType: string;
  petBreed: string;
  petAge: string;
  petGender: string;
  description: string;
  createdAt: string;
  userId?: {
    name: string;
  };
  contactPhone?: string;
  contactEmail?: string;
}

interface LocationState {
  lat: number;
  lng: number;
}

export default function VetDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeCases: 0,
    completedCases: 0,
    pendingConsultations: 0,
  });
  const [requests, setRequests] = useState<VetRequest[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<NearbyPost[]>([]);
  const [vetConsultantPosts, setVetConsultantPosts] = useState<
    VetConsultantPost[]
  >([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<LocationState | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "vet") {
      router.push("/");
    }
  }, [user, loading, router]);

  // Function to fetch vet dashboard data
  const fetchVetData = async () => {
    setDataLoading(true);
    setError("");

    try {
      // Fetch vet requests
      const response = await axios.get("/api/vet/requests");

      if (response.data) {
        setRequests(response.data.requests || []);
        console.log(response.data);
        setStats({
          activeCases: response.data.stats?.activeCases || 0,
          completedCases: response.data.stats?.completedCases || 0,
          pendingConsultations: response.data.stats?.pendingConsultations || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching vet data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setDataLoading(false);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error: GeolocationPositionError) => {
          console.error("Error getting location:", error);
          // Set default location (can be a central location in the city)
          setLocation({ lat: 40.7128, lng: -74.006 }); // New York as default
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setLocation({ lat: 40.7128, lng: -74.006 }); // New York as default
    }
  };

  // Fetch nearby pet posts
  const fetchNearbyPosts = async () => {
    if (!location) {
      console.log("Location not available yet");
      return;
    }

    try {
      console.log(
        `Fetching nearby posts for location: ${location.lat}, ${location.lng}`
      );
      const response = await axios.get(
        `/api/posts/nearby?longitude=${location.lng}&latitude=${location.lat}&distance=10&postType=emergency,wounded`
      );
      console.log("Nearby posts response:", response.data);
      setNearbyPosts(response.data.data || []);
    } catch (err: unknown) {
      console.error("Error fetching nearby posts:", err);

      // Check if error is an axios error with response
      if (axios.isAxiosError(err)) {
        console.error("Error details:", err.response?.data);
        // Optionally show an error message to the user
        if (err.response?.status === 400) {
          console.warn(
            "Bad request - possibly invalid coordinates or no posts with location data"
          );
        }
      }

      // Set empty array on error to prevent UI issues
      setNearbyPosts([]);
    }
  };

  // Fetch vet consultant posts
  const fetchVetConsultantPosts = async () => {
    try {
      const response = await axios.get(
        "/api/posts?postType=vet-consultant&status=active"
      );
      console.log("Vet consultant posts response:", response.data);
      setVetConsultantPosts(response.data.posts || []);
    } catch (err) {
      console.error("Error fetching vet consultant posts:", err);
    }
  };

  // Handle resolving a vet consultant post
  const handleResolveConsultation = async (postId: string) => {
    if (
      !confirm("Are you sure you want to resolve and remove this consultation?")
    ) {
      return;
    }

    try {
      // Delete the post from database
      await axios.delete(`/api/posts/${postId}`);

      // Update stats to reflect the resolved case
      setStats((prevStats) => ({
        ...prevStats,
        completedCases: prevStats.completedCases + 1,
        pendingConsultations: Math.max(0, prevStats.pendingConsultations - 1),
      }));

      // Refresh the vet consultant posts
      fetchVetConsultantPosts();
    } catch (err) {
      console.error("Error resolving consultation:", err);
      setError("Failed to resolve consultation. Please try again.");
    }
  };

  // Fetch vet data when component mounts and user is authenticated
  useEffect(() => {
    if (user && user.role === "vet") {
      fetchVetData();
      fetchVetConsultantPosts();
      getUserLocation();
    }
  }, [user]);

  // Fetch nearby posts when location is available
  useEffect(() => {
    if (location && user && user.role === "vet") {
      fetchNearbyPosts();
    }
  }, [location, user]);

  // Function to handle accepting a request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Use PATCH to assign the vet and change status
      await axios.patch(`/api/vet/requests/${requestId}`, { action: "assign" });
      // Refresh data after update
      fetchVetData();
    } catch (err) {
      console.error("Error accepting request:", err);
      setError("Failed to accept request. Please try again.");
    }
  };

  // Function to handle completing a request
  const handleCompleteRequest = async (requestId: string) => {
    try {
      await axios.put(`/api/vet/requests/${requestId}`, {
        status: "completed",
      });
      // Refresh data after update
      fetchVetData();
    } catch (err) {
      console.error("Error completing request:", err);
      setError("Failed to complete request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== "vet") {
    return null;
  }

  // Show loading state when fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 via-blue-500 to-green-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-wide mb-2">
                Vet Dashboard
              </h1>
              <p className="text-white text-opacity-80">
                Welcome back, Dr. {user.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md transition duration-200"
              >
                My Profile
              </Link>
              <Link
                href="/"
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md transition duration-200"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Cases
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.activeCases || 0}
                </p>
              </div>
            </div>
          </div>

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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completedCases || 0}
                </p>
              </div>
            </div>
          </div>

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
                    d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingConsultations || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Actions5
            </h3>
            <div className="space-y-3">
              <Link
                href="/posts?postType=emergency"
                className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center"
              >
                Emergency Pet Posts
              </Link>
              <Link
                href="/posts?postType=wounded"
                className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center"
              >
                Wounded Pet Posts
              </Link>
              <Link
                href="/posts?postType=missing"
                className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center"
              >
                Missing Pet Posts
              </Link>
            </div>
          </div>

          {/* Nearby Emergency Posts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Nearby Emergency Posts
            </h3>
            {nearbyPosts && nearbyPosts.length > 0 ? (
              <div className="space-y-4">
                {nearbyPosts.slice(0, 3).map((post) => (
                  <Link href={`/posts/${post._id}`} key={post._id}>
                    <div className="p-3 border border-red-200 rounded-md hover:bg-red-50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${post.postType === "emergency" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"} mr-2`}
                            >
                              {post.postType.charAt(0).toUpperCase() +
                                post.postType.slice(1)}
                            </span>
                            <p className="text-sm font-medium text-gray-900">
                              {post.petName}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {post.description &&
                              post.description.substring(0, 60)}
                            ...
                          </p>
                          {post.location && post.location.address && (
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Location:</span>{" "}
                              {post.location.address.substring(0, 30)}
                              {post.location.address.length > 30 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/posts?postType=emergency,wounded"
                  className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Emergency Posts
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No nearby emergency posts found.
              </p>
            )}
          </div>
        </div>

        {/* Vet Requests Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Vet Requests
          </h3>
          {requests && requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pet Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.petName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.requestType === "emergency"
                              ? "bg-red-100 text-red-800"
                              : request.requestType === "consultation"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {request.requestType.charAt(0).toUpperCase() +
                            request.requestType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.userId?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "accepted"
                                ? "bg-blue-100 text-blue-800"
                                : request.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {request.status === "pending" && (
                            <button
                              onClick={() => handleAcceptRequest(request._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Accept
                            </button>
                          )}
                          {request.status === "accepted" && (
                            <button
                              onClick={() => handleCompleteRequest(request._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
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
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Complete
                            </button>
                          )}
                          {request.status === "completed" && (
                            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <p className="text-gray-500">No vet requests found</p>
              <p className="text-sm text-gray-400 mt-1">
                New veterinary requests will appear here
              </p>
            </div>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Emergency Contacts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-800">Animal Control</h4>
              <p className="text-sm text-gray-600">(555) 123-4567</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-800">Emergency Vet</h4>
              <p className="text-sm text-gray-600">(555) 987-6543</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-800">Rescue Center</h4>
              <p className="text-sm text-gray-600">(555) 456-7890</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
