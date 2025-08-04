// pages/vet-dashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";

export default function VetDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
    pendingConsultations: 0
  });
  const [requests, setRequests] = useState([]);
  const [nearbyPosts, setNearbyPosts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

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
        setStats({
          totalCases: response.data.stats?.total || 0,
          activeCases: response.data.stats?.active || 0,
          completedCases: response.data.stats?.completed || 0,
          pendingConsultations: response.data.stats?.pending || 0
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
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Set default location (can be a central location in the city)
          setLocation({ lat: 40.7128, lng: -74.0060 }); // New York as default
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setLocation({ lat: 40.7128, lng: -74.0060 }); // New York as default
    }
  };
  
  // Fetch nearby pet posts
  const fetchNearbyPosts = async () => {
    try {
      const response = await axios.get(`/api/posts/nearby?lng=${location.lng}&lat=${location.lat}&distance=10&postType=emergency,wounded`);
      setNearbyPosts(response.data.posts || []);
    } catch (err) {
      console.error("Error fetching nearby posts:", err);
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
  }, [location]);
  
  // Function to handle accepting a request
  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.put(`/api/vet/requests/${requestId}`, { status: "accepted" });
      // Refresh data after update
      fetchVetData();
    } catch (err) {
      console.error("Error accepting request:", err);
      setError("Failed to accept request. Please try again.");
    }
  };
  
  // Function to handle completing a request
  const handleCompleteRequest = async (requestId) => {
    try {
      await axios.put(`/api/vet/requests/${requestId}`, { status: "completed" });
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
              <h1 className="text-4xl font-bold tracking-wide mb-2">Vet Dashboard</h1>
              <p className="text-white text-opacity-80">Welcome back, Dr. {user.name}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCases || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeCases || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedCases || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingConsultations || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/posts?postType=emergency" className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center">
                Emergency Pet Posts
              </Link>
              <Link href="/posts?postType=wounded" className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center">
                Wounded Pet Posts
              </Link>
              <Link href="/posts?postType=missing" className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 text-center">
                Missing Pet Posts
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Cases</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-3">
              {requests.length > 0 ? (
                requests.slice(0, 5).map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-800">{request.petName} - {request.requestType}</p>
                      <p className="text-sm text-gray-600">Case #{request._id.substring(0, 8)}</p>
                      <p className="text-xs text-gray-500">{request.userId?.name || 'Unknown User'}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 text-xs rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : request.status === 'accepted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      {request.status === 'pending' && (
                        <button 
                          onClick={() => handleAcceptRequest(request._id)}
                          className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Accept
                        </button>
                      )}
                      {request.status === 'accepted' && (
                        <button 
                          onClick={() => handleCompleteRequest(request._id)}
                          className="mt-2 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No cases found</p>
              )}
              
              {requests.length > 5 && (
                <div className="text-center mt-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View All Cases
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {requests.filter(req => req.status === 'accepted').length > 0 ? (
                requests
                  .filter(req => req.status === 'accepted')
                  .slice(0, 3)
                  .map((request, index) => {
                    // Generate a mock time for demonstration purposes
                    const hours = 9 + index * 2;
                    const time = `${hours}:00 ${hours >= 12 ? 'PM' : 'AM'}`;
                    
                    return (
                      <div key={request._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-800">{time}</p>
                          <p className="text-sm text-gray-600">{request.requestType} - {request.petName}</p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-gray-500 text-center py-4">No scheduled appointments</p>
              )}
            </div>
          </div>
          
          {/* Nearby Emergency Posts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nearby Emergency Posts</h3>
            {nearbyPosts && nearbyPosts.length > 0 ? (
              <div className="space-y-4">
                {nearbyPosts.slice(0, 3).map((post) => (
                  <Link href={`/posts/${post._id}`} key={post._id}>
                    <div className="p-3 border border-red-200 rounded-md hover:bg-red-50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${post.postType === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'} mr-2`}>
                              {post.postType.charAt(0).toUpperCase() + post.postType.slice(1)}
                            </span>
                            <p className="text-sm font-medium text-gray-900">{post.petName}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{post.description && post.description.substring(0, 60)}...</p>
                          {post.location && post.location.address && (
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Location:</span> {post.location.address.substring(0, 30)}{post.location.address.length > 30 ? '...' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/posts?postType=emergency,wounded" className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All Emergency Posts
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No nearby emergency posts found.</p>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contacts</h3>
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