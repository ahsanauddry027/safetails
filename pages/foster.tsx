// pages/foster.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center">
      <div className="loading-spinner"></div>
      <p className="ml-4 text-gray-600">Loading map...</p>
    </div>
  ),
});

interface FosterRequest {
  _id: string;
  petName: string;
  petType: string;
  petBreed?: string;
  petAge?: string;
  petGender?: string;
  petColor?: string;
  petCategory?: string;
  description: string;
  images: string[];
  location?: {
    coordinates?: [number, number];
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  fosterType: 'temporary' | 'long-term' | 'emergency';
  duration: string;
  startDate: string;
  endDate?: string;
  requirements: string[];
  specialNeeds?: string;
  medicalHistory?: string;
  isUrgent: boolean;
  status: 'pending' | 'active' | 'matched' | 'completed' | 'cancelled';
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  fosterParent?: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    experience: string;
    homeEnvironment: string;
    otherPets: boolean;
    children: boolean;
    workSchedule: string;
    reason: string;
  };
  applications: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FosterPage() {
  const { user } = useAuth();
  const [fosterRequests, setFosterRequests] = useState<FosterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    fosterType: "",
    petType: "",
    city: "",
    state: "",
    isUrgent: false,
  });
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<FosterRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch foster requests based on filters and search
  useEffect(() => {
    fetchFosterRequests();
  }, [filters, searchTerm, currentPage]);

  const fetchFosterRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append("search", searchTerm);
      if (filters.status) params.append("status", filters.status);
      if (filters.fosterType) params.append("fosterType", filters.fosterType);
      if (filters.petType) params.append("petType", filters.petType);
      if (filters.city) params.append("city", filters.city);
      if (filters.state) params.append("state", filters.state);
      if (filters.isUrgent) params.append("isUrgent", "true");
      params.append("page", currentPage.toString());
      params.append("limit", "10");

      const response = await axios.get(`/api/foster?${params.toString()}`);
      
      if (response.data.success) {
        setFosterRequests(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching foster requests:", err);
      setError("Failed to load foster requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      fosterType: "",
      petType: "",
      city: "",
      state: "",
      isUrgent: false,
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      active: "bg-green-100 text-green-800 border-green-200",
      matched: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getFosterTypeBadge = (type: string) => {
    const typeConfig = {
      temporary: "bg-blue-100 text-blue-800 border-blue-200",
      "long-term": "bg-purple-100 text-purple-800 border-purple-200",
      emergency: "bg-red-100 text-red-800 border-red-200",
    };
    return typeConfig[type as keyof typeof typeConfig] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Foster Requests</h1>
              <p className="mt-2 text-gray-600">
                Find pets in need of temporary or long-term foster care
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showMap ? "Hide Map" : "Show Map"}
              </button>
              
              {user && (
                <Link
                  href="/create-foster"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Foster Request
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Foster Requests
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by pet name, description, or breed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="matched">Matched</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Foster Type Filter */}
            <div>
              <label htmlFor="fosterType" className="block text-sm font-medium text-gray-700 mb-1">
                Foster Type
              </label>
              <select
                id="fosterType"
                name="fosterType"
                value={filters.fosterType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="temporary">Temporary</option>
                <option value="long-term">Long-term</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Pet Type Filter */}
            <div>
              <label htmlFor="petType" className="block text-sm font-medium text-gray-700 mb-1">
                Pet Type
              </label>
              <select
                id="petType"
                name="petType"
                value={filters.petType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Pets</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Enter city..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* State Filter */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                placeholder="Enter state..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Urgent Filter */}
            <div className="flex items-center">
              <input
                id="isUrgent"
                name="isUrgent"
                type="checkbox"
                checked={filters.isUrgent}
                onChange={handleFilterChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-900">
                Urgent Only
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
            
            <div className="text-sm text-gray-600">
              Found {total} foster request{total !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Map View */}
        {showMap && userLocation && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Foster Request Locations</h3>
            <div className="h-96 rounded-lg overflow-hidden">
              <LeafletMap
                center={[userLocation.lat, userLocation.lng]}
                onMapClick={() => {}}
                markers={[
                  {
                    position: [userLocation.lat, userLocation.lng],
                    popup: 'Your Location'
                  }
                ]}
                height="384px"
              />
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading foster requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={fetchFosterRequests}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : fosterRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No foster requests found matching your criteria.</div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {fosterRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {request.petName}
                            {request.isUrgent && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                🚨 Urgent
                              </span>
                            )}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {request.petType} • {request.location?.city || 'Location not specified'}, {request.location?.state || ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getFosterTypeBadge(request.fosterType)}`}>
                              {request.fosterType.charAt(0).toUpperCase() + request.fosterType.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Duration: {request.duration}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3">{request.description}</p>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Start Date:</span> {formatDate(request.startDate)}
                        {request.endDate && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="font-medium">End Date:</span> {formatDate(request.endDate)}
                          </>
                        )}
                      </div>

                      {request.requirements.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Requirements: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.requirements.map((req, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                              >
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Posted by {request.userId.name}</span>
                        <span>{request.applications.length} application{request.applications.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <nav className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-4 border">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Foster Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-900">{selectedRequest.petName}</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pet Details</h4>
                    <p><span className="font-medium">Type:</span> {selectedRequest.petType}</p>
                    {selectedRequest.petBreed && <p><span className="font-medium">Breed:</span> {selectedRequest.petBreed}</p>}
                    {selectedRequest.petAge && <p><span className="font-medium">Age:</span> {selectedRequest.petAge}</p>}
                    {selectedRequest.petGender && <p><span className="font-medium">Gender:</span> {selectedRequest.petGender}</p>}
                    {selectedRequest.petColor && <p><span className="font-medium">Color:</span> {selectedRequest.petColor}</p>}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Foster Details</h4>
                    <p><span className="font-medium">Type:</span> {selectedRequest.fosterType}</p>
                    <p><span className="font-medium">Duration:</span> {selectedRequest.duration}</p>
                    <p><span className="font-medium">Status:</span> {selectedRequest.status}</p>
                    <p><span className="font-medium">Start Date:</span> {formatDate(selectedRequest.startDate)}</p>
                    {selectedRequest.endDate && <p><span className="font-medium">End Date:</span> {formatDate(selectedRequest.endDate)}</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedRequest.description}</p>
                </div>

                {selectedRequest.specialNeeds && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Special Needs</h4>
                    <p className="text-gray-700">{selectedRequest.specialNeeds}</p>
                  </div>
                )}

                {selectedRequest.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.requirements.map((req, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                                      <p className="text-gray-700">{selectedRequest.location?.address || 'Address not specified'}</p>
                  <p className="text-gray-600">
                  {selectedRequest.location?.city || 'Location not specified'}
                  {selectedRequest.location?.state && `, ${selectedRequest.location.state}`}
                  {selectedRequest.location?.zipCode && ` ${selectedRequest.location.zipCode}`}
                </p>
                </div>

                <div className="flex gap-3 pt-4">
                  {user && selectedRequest.status === 'active' && (
                    <Link
                      href={`/foster/apply/${selectedRequest._id}`}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-indigo-700"
                    >
                      Apply to Foster
                    </Link>
                  )}
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-center font-medium hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
