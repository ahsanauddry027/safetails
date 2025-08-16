// pages/vet-directory.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";
import dynamic from "next/dynamic";
import CreateVetEntryModal from "@/components/CreateVetEntryModal";

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

interface VetDirectoryEntry {
  _id: string;
  clinicName: string;
  specialization: string[];
  services: string[];
  location: {
    coordinates: [number, number];
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  contactInfo: {
    phone: string;
    email?: string;
    website?: string;
    emergencyPhone?: string;
  };
  operatingHours: {
    [key: string]: { open: string; close: string };
  };
  isEmergencyAvailable: boolean;
  is24Hours: boolean;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  vetId?: string | {
    name: string;
    email: string;
    phone?: string;
  };
}

export default function VetDirectory() {
  const { user } = useAuth();
  const [vets, setVets] = useState<VetDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    specialization: "",
    isEmergencyAvailable: false,
    is24Hours: false,
    city: "",
    state: "",
  });
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedVet, setSelectedVet] = useState<VetDirectoryEntry | null>(null);
  const [distance, setDistance] = useState(50); // Default 50km
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Helper function to safely get vet name
  const getVetName = (vet: VetDirectoryEntry) => {
    if (typeof vet.vetId === 'object' && vet.vetId?.name) {
      return vet.vetId.name;
    }
    return "Unknown Vet";
  };

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

  // Fetch vets based on filters and search
  useEffect(() => {
    fetchVets();
  }, [filters, searchTerm, userLocation, distance]);

  const fetchVets = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append("search", searchTerm);
      if (filters.specialization) params.append("specialization", filters.specialization);
      if (filters.isEmergencyAvailable) params.append("isEmergencyAvailable", "true");
      if (filters.is24Hours) params.append("is24Hours", "true");
      if (filters.city) params.append("city", filters.city);
      if (filters.state) params.append("state", filters.state);
      
      // Add location-based search if user location is available
      if (userLocation) {
        params.append("longitude", userLocation.lng.toString());
        params.append("latitude", userLocation.lat.toString());
        params.append("distance", distance.toString());
      }

      const response = await axios.get(`/api/vet-directory?${params.toString()}`);
      
      if (response.data.success) {
        setVets(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching vets:", err);
      setError("Failed to load vet directory. Please try again.");
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
  };

  const clearFilters = () => {
    setFilters({
      specialization: "",
      isEmergencyAvailable: false,
      is24Hours: false,
      city: "",
      state: "",
    });
    setSearchTerm("");
  };

  const getOperatingHours = (hours: any) => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const today = days[new Date().getDay() - 1] || "monday";
    const todayHours = hours[today];
    
    if (!todayHours || (!todayHours.open && !todayHours.close)) {
      return "Closed today";
    }
    
    if (todayHours.open && todayHours.close) {
      return `${todayHours.open} - ${todayHours.close}`;
    }
    
    return "Hours vary";
  };

  const getSpecializationBadges = (specializations: string[]) => {
    return specializations.map((spec, index) => (
      <span
        key={index}
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full mr-2 mb-2 ${
          spec === "emergency"
            ? "bg-red-100 text-red-800"
            : spec === "surgery"
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {spec}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Emergency Vet Directory</h1>
              <p className="mt-2 text-gray-600">
                Find qualified veterinarians and emergency pet care services near you
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setShowMap(!showMap)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showMap ? "Hide Map" : "Show Map"}
              </button>
              
              {/* Only show create form button for vets */}
              {user && user.role === 'vet' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add My Clinic
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
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Vets
              </label>
              <input
                type="text"
                id="search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by clinic name, specialization, or services..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Specialization Filter */}
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select
                id="specialization"
                name="specialization"
                value={filters.specialization}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Specializations</option>
                <option value="emergency">Emergency</option>
                <option value="surgery">Surgery</option>
                <option value="vaccination">Vaccination</option>
                <option value="checkup">Checkup</option>
                <option value="dental">Dental</option>
                <option value="orthopedic">Orthopedic</option>
                <option value="dermatology">Dermatology</option>
                <option value="cardiology">Cardiology</option>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Checkboxes */}
            <div className="flex items-center">
              <input
                id="isEmergencyAvailable"
                name="isEmergencyAvailable"
                type="checkbox"
                checked={filters.isEmergencyAvailable}
                onChange={handleFilterChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isEmergencyAvailable" className="ml-2 block text-sm text-gray-900">
                Emergency Available
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="is24Hours"
                name="is24Hours"
                type="checkbox"
                checked={filters.is24Hours}
                onChange={handleFilterChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is24Hours" className="ml-2 block text-sm text-gray-900">
                24 Hours
              </label>
            </div>

            {/* Distance Slider */}
            <div className="md:col-span-2">
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius: {distance}km
              </label>
              <input
                type="range"
                id="distance"
                min="5"
                max="200"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
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
                📍 Searching near your location
              </div>
            )}
          </div>
        </div>

        {/* Map View */}
        {showMap && userLocation && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vet Locations</h3>
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
              <p className="mt-4 text-gray-600">Loading vet directory...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={fetchVets}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : vets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No veterinarians found matching your criteria.</div>
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
                  Found {vets.length} veterinarian{vets.length !== 1 ? "s" : ""}
                </h2>
                <div className="text-sm text-gray-600">
                  Showing results within {distance}km radius
                </div>
              </div>

              {vets.map((vet) => (
                <div
                  key={vet._id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedVet(vet)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {vet.clinicName}
                            {vet.isVerified && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Verified
                              </span>
                            )}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            Dr. {getVetName(vet)} • {vet.location.city}, {vet.location.state}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center mb-1">
                            <span className="text-yellow-400">★</span>
                            <span className="ml-1 text-sm text-gray-600">
                              {vet.rating.toFixed(1)} ({vet.totalReviews} reviews)
                            </span>
                          </div>
                          {vet.isEmergencyAvailable && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🚨 Emergency
                            </span>
                          )}
                          {vet.is24Hours && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                              24/7
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        {getSpecializationBadges(vet.specialization)}
                      </div>

                      <p className="text-gray-700 mb-3">{vet.location.address}</p>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Hours:</span> {getOperatingHours(vet.operatingHours)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {vet.contactInfo.phone && (
                          <a
                            href={`tel:${vet.contactInfo.phone}`}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 {vet.contactInfo.phone}
                          </a>
                        )}
                        {vet.contactInfo.emergencyPhone && (
                          <a
                            href={`tel:${vet.contactInfo.emergencyPhone}`}
                            className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🚨 Emergency: {vet.contactInfo.emergencyPhone}
                          </a>
                        )}
                        {vet.contactInfo.email && (
                          <a
                            href={`mailto:${vet.contactInfo.email}`}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ✉️ Email
                          </a>
                        )}
                        {vet.contactInfo.website && (
                          <a
                            href={vet.contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium hover:bg-purple-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🌐 Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Vet Detail Modal */}
      {selectedVet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-900">{selectedVet.clinicName}</h3>
                <button
                  onClick={() => setSelectedVet(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Phone:</span> {selectedVet.contactInfo.phone}</p>
                    {selectedVet.contactInfo.emergencyPhone && (
                      <p><span className="font-medium">Emergency:</span> {selectedVet.contactInfo.emergencyPhone}</p>
                    )}
                    {selectedVet.contactInfo.email && (
                      <p><span className="font-medium">Email:</span> {selectedVet.contactInfo.email}</p>
                    )}
                    {selectedVet.contactInfo.website && (
                      <p><span className="font-medium">Website:</span> 
                        <a href={selectedVet.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {selectedVet.contactInfo.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-700">{selectedVet.location.address}</p>
                  <p className="text-gray-600">{selectedVet.location.city}, {selectedVet.location.state} {selectedVet.location.zipCode}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Services & Specializations</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {getSpecializationBadges(selectedVet.specialization)}
                  </div>
                  {selectedVet.services.length > 0 && (
                    <div>
                      <span className="font-medium">Services:</span>
                      <p className="text-gray-700">{selectedVet.services.join(", ")}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Operating Hours</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedVet.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}:</span>
                        <span className="text-gray-600">
                          {hours.open && hours.close ? `${hours.open} - ${hours.close}` : "Closed"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <a
                    href={`tel:${selectedVet.contactInfo.phone}`}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-green-700"
                  >
                    Call Now
                  </a>
                  {selectedVet.contactInfo.emergencyPhone && (
                    <a
                      href={`tel:${selectedVet.contactInfo.emergencyPhone}`}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-red-700"
                    >
                      Emergency
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Vet Directory Entry Modal - Only for Vets */}
      {showCreateForm && user && user.role === 'vet' && (
        <CreateVetEntryModal 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchVets(); // Refresh the list
          }}
        />
      )}
    </div>
  );
}
