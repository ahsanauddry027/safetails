import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import dynamic from "next/dynamic";
import AlertCard from "@/components/AlertCard";
import CreateAlertModal from "@/components/CreateAlertModal";

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

interface Alert {
  _id: string;
  type: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    radius: number;
  };
  petDetails?: {
    petType: string;
    petBreed?: string;
    petColor?: string;
    petAge?: string;
    petGender?: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  expiresAt?: string;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    urgency: "",
    status: "active",
  });
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [radius, setRadius] = useState(10); // Default 10km
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Fetch alerts based on filters and search
  useEffect(() => {
    fetchAlerts();
  }, [filters, searchTerm, currentPage, userLocation, radius]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (searchTerm) params.append("search", searchTerm);
      if (filters.type) params.append("type", filters.type);
      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.status) params.append("status", filters.status);
      params.append("page", currentPage.toString());
      params.append("limit", "10");

      // Add location-based search if user location is available
      if (userLocation) {
        params.append("latitude", userLocation.lat.toString());
        params.append("longitude", userLocation.lng.toString());
        params.append("radius", radius.toString());
      }

      const response = await axios.get(`/api/alerts?${params.toString()}`);

      if (response.data.success) {
        setAlerts(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      urgency: "",
      status: "active",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await axios.put(`/api/alerts?id=${alertId}`, {
        status: "resolved",
      });

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === alertId ? { ...alert, status: "resolved" } : alert
        )
      );

      // Refresh the list
      fetchAlerts();
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };

  const handleViewDetails = (alertId: string) => {
    const alert = alerts.find((a) => a._id === alertId);
    if (alert) {
      setSelectedAlert(alert);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lost_pet":
        return "🐕";
      case "found_pet":
        return "🏠";
      case "foster_request":
        return "🏡";
      case "emergency":
        return "🚨";
      case "adoption":
        return "❤️";
      default:
        return "📢";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pet Alerts</h1>
              <p className="mt-2 text-gray-600">
                Stay informed about nearby pet-related activities and
                emergencies
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Radius filter: Only shows alerts with coverage area ≤ your
                search radius
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
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Alert
                </button>
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
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Alerts
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, or pet details..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Alert Type Filter */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Alert Type
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="lost_pet">Lost Pet</option>
                <option value="found_pet">Found Pet</option>
                <option value="foster_request">Foster Request</option>
                <option value="emergency">Emergency</option>
                <option value="adoption">Adoption</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <label
                htmlFor="urgency"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Urgency
              </label>
              <select
                id="urgency"
                name="urgency"
                value={filters.urgency}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Urgency Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Radius Slider */}
            <div className="md:col-span-2">
              <label
                htmlFor="radius"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Radius: {radius}km
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Only shows alerts with radius ≤ {radius}km)
                </span>
              </label>
              <input
                type="range"
                id="radius"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>

            {userLocation && (
              <div className="text-sm text-gray-600">
                📍 Searching within {radius}km of your location
                <br />
                <span className="text-xs text-gray-500">
                  Only showing alerts with radius ≤ {radius}km
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Map View */}
        {showMap && userLocation && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Alert Locations
            </h3>
            <div className="h-96 rounded-lg overflow-hidden">
              <LeafletMap
                center={[userLocation.lat, userLocation.lng]}
                onMapClick={() => {}}
                markers={[
                  {
                    position: [userLocation.lat, userLocation.lng],
                    popup: "Your Location",
                  },
                  ...alerts.map((alert) => ({
                    position: [
                      alert.location.coordinates[1],
                      alert.location.coordinates[0],
                    ] as [number, number],
                    popup: `${alert.type.replace("_", " ")}: ${alert.title}`,
                  })),
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
              <p className="mt-4 text-gray-600">Loading alerts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={fetchAlerts}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                No alerts found matching your criteria.
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Found {total} alert{total !== 1 ? "s" : ""}
                </h2>
                <div className="text-sm text-gray-600">
                  Showing alerts with radius ≤ {radius}km within your search
                  area
                </div>
              </div>

              {alerts.map((alert) => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  onViewDetails={handleViewDetails}
                  onResolve={handleResolveAlert}
                  showActions={true}
                />
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
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">
                    {getTypeIcon(selectedAlert.type)}
                  </span>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {selectedAlert.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full border ${getUrgencyColor(selectedAlert.urgency)}`}
                  >
                    {selectedAlert.urgency.charAt(0).toUpperCase() +
                      selectedAlert.urgency.slice(1)}{" "}
                    Urgency
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-800">
                    {selectedAlert.type
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-700">{selectedAlert.description}</p>
                </div>

                {selectedAlert.petDetails && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Pet Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Type:</span>{" "}
                        {selectedAlert.petDetails.petType}
                      </div>
                      {selectedAlert.petDetails.petBreed && (
                        <div>
                          <span className="font-medium">Breed:</span>{" "}
                          {selectedAlert.petDetails.petBreed}
                        </div>
                      )}
                      {selectedAlert.petDetails.petColor && (
                        <div>
                          <span className="font-medium">Color:</span>{" "}
                          {selectedAlert.petDetails.petColor}
                        </div>
                      )}
                      {selectedAlert.petDetails.petAge && (
                        <div>
                          <span className="font-medium">Age:</span>{" "}
                          {selectedAlert.petDetails.petAge}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-700">
                    {selectedAlert.location.address}
                  </p>
                  <p className="text-gray-600">
                    {selectedAlert.location.city},{" "}
                    {selectedAlert.location.state}
                  </p>
                  <p className="text-sm text-gray-500">
                    Alert radius: {selectedAlert.location.radius}km
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedAlert.status === "active" && (
                    <button
                      onClick={() => {
                        handleResolveAlert(selectedAlert._id);
                        setSelectedAlert(null);
                      }}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAlert(null)}
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

      {/* Create Alert Modal */}
      {showCreateModal && (
        <CreateAlertModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAlerts(); // Refresh the list
          }}
        />
      )}
    </div>
  );
}
