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
  petType: string;
  petBreed?: string;
  petAge?: string;
  petGender?: string;
  requestType: string;
  description: string;
  status: string;
  contactPhone?: string;
  contactEmail?: string;
  images?: string[];
  createdAt: string;
  userId?: {
    name: string;
    email?: string;
    phone?: string;
  };
  vetId?: {
    name: string;
    email?: string;
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
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<LocationState | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VetRequest | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
        // The requests are now in response.data.requests.data
        const requestsData = response.data.requests?.data || [];
        setRequests(requestsData);
        console.log("Vet requests data:", response.data);
        console.log("First request images:", requestsData[0]?.images);
        setStats({
          activeCases: response.data.stats?.data?.activeCases || 0,
          completedCases: response.data.stats?.data?.completedCases || 0,
          pendingConsultations:
            response.data.stats?.data?.pendingConsultations || 0,
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

  // Fetch vet data when component mounts and user is authenticated
  useEffect(() => {
    if (user && user.role === "vet") {
      fetchVetData();
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

  // Function to handle rejecting a request
  const handleRejectRequest = async (requestId: string) => {
    if (
      !confirm(
        "Are you sure you want to reject and delete this request? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/vet/requests/${requestId}`);
      // Refresh data after deletion
      fetchVetData();
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError("Failed to reject request. Please try again.");
    }
  };

  // Function to handle deleting a request
  const handleDeleteRequest = async (requestId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this request? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/vet/requests/${requestId}`);
      // Refresh data after update
      fetchVetData();
    } catch (err) {
      console.error("Error deleting request:", err);
      setError("Failed to delete request. Please try again.");
    }
  };

  // Function to handle viewing request details
  const handleViewDetails = (request: VetRequest) => {
    console.log("Selected request details:", request);
    console.log("Selected request images:", request.images);
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  // Function to close the details modal
  const closeDetailsModal = () => {
    setSelectedRequest(null);
    setShowDetailsModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner"></div>
        <p className="ml-4 text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== "vet") {
    return null;
  }

  // Show loading state when fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-black via-gray-800 to-black text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="flex items-center justify-between">
            <div className="group">
              <h1 className="text-6xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Vet Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-6">
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
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
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
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">
                  Active Cases
                </p>
                <p className="text-4xl font-bold text-black">
                  {stats.activeCases || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">
                  Completed
                </p>
                <p className="text-4xl font-bold text-black">
                  {stats.completedCases || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-4 bg-black rounded-full group-hover:scale-110 transition-all duration-300 shadow-lg">
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
                    d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"
                  />
                </svg>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">
                  Pending
                </p>
                <p className="text-4xl font-bold text-black">
                  {stats.pendingConsultations || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center group-hover:text-primary transition-colors duration-300">
              <svg
                className="w-6 h-6 mr-3"
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
            </h3>
            <div className="space-y-4">
              <Link
                href="/posts?postType=emergency"
                className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold">
                  Emergency Pet Posts
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/posts?postType=wounded"
                className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold">
                  Wounded Pet Posts
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/posts?postType=missing"
                className="group relative block w-full text-center px-6 py-4 text-white bg-black border-2 border-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold">
                  Missing Pet Posts
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>

          {/* Enhanced Nearby Emergency Posts */}
          <div className="group bg-white rounded-3xl shadow-lg p-8 border-4 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center group-hover:text-primary transition-colors duration-300">
              <svg
                className="w-6 h-6 mr-3"
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
              Nearby Emergency Posts
            </h3>
            {nearbyPosts && nearbyPosts.length > 0 ? (
              <div className="space-y-4">
                {nearbyPosts.slice(0, 3).map((post) => (
                  <Link href={`/posts/${post._id}`} key={post._id}>
                    <div className="group/item p-4 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-black transition-all duration-300 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span
                              className={`px-3 py-1 text-sm rounded-full font-bold mr-3 ${
                                post.postType === "emergency"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {post.postType.charAt(0).toUpperCase() +
                                post.postType.slice(1)}
                            </span>
                            <p className="text-lg font-bold text-black">
                              {post.petName}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {post.description &&
                              post.description.substring(0, 60)}
                            ...
                          </p>
                          {post.location && post.location.address && (
                            <p className="text-sm text-gray-500 mt-2">
                              <span className="font-semibold">Location:</span>{" "}
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
                  className="block text-center text-black hover:text-primary text-lg font-bold transition-colors duration-300"
                >
                  View All Emergency Posts
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">
                  No nearby emergency posts found.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Vet Requests Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12 border-4 border-gray-200 hover:border-black transition-all duration-300">
          <h3 className="text-3xl font-bold text-black mb-8 flex items-center">
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
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Vet Requests
          </h3>
          {requests && requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Pet Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Request Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr
                      key={request._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-lg font-bold text-black">
                          {request.petName}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <span
                          className={`px-4 py-2 inline-flex text-sm leading-5 font-bold rounded-full ${
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
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-lg text-black">
                          {request.userId?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <span
                          className={`px-4 py-2 inline-flex text-sm leading-5 font-bold rounded-full ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "accepted"
                                ? "bg-blue-100 text-blue-800"
                                : request.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : request.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          {/* View Details Button - Always visible */}
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="group relative inline-flex items-center px-3 py-2 border-2 border-blue-500 text-blue-500 bg-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-blue-500 hover:text-white transform hover:-translate-y-1"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
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
                            <span className="font-bold text-xs">View</span>
                          </button>

                          {/* Status-specific action buttons */}
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(request._id)}
                                className="group relative inline-flex items-center px-3 py-2 border-2 border-green-500 text-green-500 bg-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-green-500 hover:text-white transform hover:-translate-y-1"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
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
                                <span className="font-bold text-xs">
                                  Accept
                                </span>
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request._id)}
                                className="group relative inline-flex items-center px-3 py-2 border-2 border-red-500 text-red-500 bg-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-red-500 hover:text-white transform hover:-translate-y-1"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
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
                                <span className="font-bold text-xs">
                                  Reject & Delete
                                </span>
                              </button>
                            </>
                          )}

                          {request.status === "accepted" && (
                            <button
                              onClick={() => handleCompleteRequest(request._id)}
                              className="group relative inline-flex items-center px-3 py-2 border-2 border-blue-500 text-blue-500 bg-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-blue-500 hover:text-white transform hover:-translate-y-1"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
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
                              <span className="font-bold text-xs">
                                Complete
                              </span>
                            </button>
                          )}

                          {/* Delete button - visible for completed requests only */}
                          {request.status === "completed" && (
                            <button
                              onClick={() => handleDeleteRequest(request._id)}
                              className="group relative inline-flex items-center px-3 py-2 border-2 border-gray-500 text-gray-500 bg-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-gray-500 hover:text-white transform hover:-translate-y-1"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
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
                              <span className="font-bold text-xs">Delete</span>
                            </button>
                          )}

                          {request.status === "completed" && (
                            <span className="inline-flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-xl font-bold text-xs">
                              <svg
                                className="w-4 h-4 mr-1"
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
            <div className="text-center py-12">
              <div className="text-gray-400 mb-6">
                <svg
                  className="mx-auto h-20 w-20"
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
              <p className="text-gray-500 text-xl font-medium">
                No vet requests found
              </p>
              <p className="text-gray-400 mt-2">
                New veterinary requests will appear here
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Emergency Contacts */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-gray-200 hover:border-black transition-all duration-300">
          <h3 className="text-3xl font-bold text-black mb-8 flex items-center">
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Emergency Contacts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-6 border-4 border-gray-200 rounded-2xl hover:border-black transition-all duration-300 hover:shadow-lg">
              <h4 className="text-xl font-bold text-black mb-2 group-hover:text-primary transition-colors duration-300">
                Animal Control
              </h4>
              <p className="text-lg text-gray-600 font-medium">
                (555) 123-4567
              </p>
            </div>
            <div className="group p-6 border-4 border-gray-200 rounded-2xl hover:border-black transition-all duration-300 hover:shadow-lg">
              <h4 className="text-xl font-bold text-black mb-2 group-hover:text-primary transition-colors duration-300">
                Emergency Vet
              </h4>
              <p className="text-lg text-gray-600 font-medium">
                (555) 987-6543
              </p>
            </div>
            <div className="group p-6 border-4 border-gray-200 rounded-2xl hover:border-black transition-all duration-300 hover:shadow-lg">
              <h4 className="text-xl font-bold text-black mb-2 group-hover:text-primary transition-colors duration-300">
                Rescue Center
              </h4>
              <p className="text-lg text-gray-600 font-medium">
                (555) 456-7890
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-black">
                  Request Details
                </h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Pet Information */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="flex-shrink-0">
                        {selectedRequest.images &&
                        selectedRequest.images.length > 0 ? (
                          <img
                            src={selectedRequest.images[0]}
                            alt={`${selectedRequest.petName}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-400 shadow-sm">
                            <svg
                              className="w-8 h-8 text-gray-500"
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
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">
                          Pet Information
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">Name:</span>{" "}
                        {selectedRequest.petName}
                      </p>
                      <p>
                        <span className="font-semibold">Type:</span>{" "}
                        {selectedRequest.petType}
                      </p>
                      {selectedRequest.petBreed && (
                        <p>
                          <span className="font-semibold">Breed:</span>{" "}
                          {selectedRequest.petBreed}
                        </p>
                      )}
                      {selectedRequest.petAge && (
                        <p>
                          <span className="font-semibold">Age:</span>{" "}
                          {selectedRequest.petAge}
                        </p>
                      )}
                      {selectedRequest.petGender && (
                        <p>
                          <span className="font-semibold">Gender:</span>{" "}
                          {selectedRequest.petGender}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">
                      Request Information
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">Type:</span>{" "}
                        {selectedRequest.requestType}
                      </p>
                      <p>
                        <span className="font-semibold">Status:</span>{" "}
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-bold ${
                            selectedRequest.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : selectedRequest.status === "accepted"
                                ? "bg-blue-100 text-blue-800"
                                : selectedRequest.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : selectedRequest.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedRequest.status.charAt(0).toUpperCase() +
                            selectedRequest.status.slice(1)}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold">Created:</span>{" "}
                        {new Date(
                          selectedRequest.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedRequest.description}
                  </p>
                </div>

                {/* Owner Information */}
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">
                    Owner Information
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {selectedRequest.userId?.name || "Unknown"}
                    </p>
                    {selectedRequest.userId?.email && (
                      <p>
                        <span className="font-semibold">Email:</span>{" "}
                        {selectedRequest.userId.email}
                      </p>
                    )}
                    {selectedRequest.contactPhone && (
                      <p>
                        <span className="font-semibold">Phone:</span>{" "}
                        {selectedRequest.contactPhone}
                      </p>
                    )}
                    {selectedRequest.contactEmail && (
                      <p>
                        <span className="font-semibold">Contact Email:</span>{" "}
                        {selectedRequest.contactEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pet Images */}
                {selectedRequest.images &&
                  selectedRequest.images.length > 1 && (
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <h3 className="text-lg font-bold text-gray-700 mb-2">
                        Pet Images
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedRequest.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${selectedRequest.petName} ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Assigned Vet Information */}
                {selectedRequest.vetId && (
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">
                      Assigned Vet
                    </h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">Name:</span>{" "}
                        {selectedRequest.vetId.name}
                      </p>
                      {selectedRequest.vetId.email && (
                        <p>
                          <span className="font-semibold">Email:</span>{" "}
                          {selectedRequest.vetId.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-colors duration-300"
                >
                  Close
                </button>

                {/* Action buttons based on status */}
                {selectedRequest.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleAcceptRequest(selectedRequest._id);
                        closeDetailsModal();
                      }}
                      className="px-6 py-3 text-white bg-green-500 rounded-2xl font-bold hover:bg-green-600 transition-colors duration-300"
                    >
                      Accept Request
                    </button>
                    <button
                      onClick={() => {
                        handleRejectRequest(selectedRequest._id);
                        closeDetailsModal();
                      }}
                      className="px-6 py-3 text-white bg-red-500 rounded-2xl font-bold hover:bg-red-600 transition-colors duration-300"
                    >
                      Reject & Delete
                    </button>
                  </>
                )}

                {selectedRequest.status === "accepted" && (
                  <button
                    onClick={() => {
                      handleCompleteRequest(selectedRequest._id);
                      closeDetailsModal();
                    }}
                    className="px-6 py-3 text-white bg-blue-500 rounded-2xl font-bold hover:bg-blue-600 transition-colors duration-300"
                  >
                    Mark Complete
                  </button>
                )}

                {selectedRequest.status === "completed" && (
                  <button
                    onClick={() => {
                      handleDeleteRequest(selectedRequest._id);
                      closeDetailsModal();
                    }}
                    className="px-6 py-3 text-white bg-gray-500 rounded-2xl font-bold hover:bg-gray-600 transition-colors duration-300"
                  >
                    Delete Request
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
