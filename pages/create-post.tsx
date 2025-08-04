// pages/create-post.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-md flex items-center justify-center">
      Loading map...
    </div>
  ),
});

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 23.8103,
  lng: 90.4125,
};

// Define types
interface FormData {
  title: string;
  postType: string;
  petName: string;
  petType: string;
  petBreed: string;
  petAge: string;
  petGender: string;
  petColor: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  lastSeenDate: string;
}

interface LocationData {
  coordinates: [number, number];
  address: string;
  description: string;
}

const CreatePost = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    postType: "missing",
    petName: "",
    petType: "",
    petBreed: "",
    petAge: "",
    petGender: "unknown",
    petColor: "",
    description: "",
    contactPhone: "",
    contactEmail: "",
    lastSeenDate: "",
  });

  // Location state
  const [location, setLocation] = useState<LocationData>({
    coordinates: [defaultCenter.lng, defaultCenter.lat],
    address: "",
    description: "",
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=create-post");
    }
  }, [user, loading, router]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocation({
            ...location,
            coordinates: [longitude, latitude],
          });
        },
        (error: GeolocationPositionError) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle map click to set location
  const handleMapClick = (lat: number, lng: number) => {
    setLocation({
      ...location,
      coordinates: [lng, lat],
    });
  };

  // Handle location description change
  const handleLocationDescChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setLocation({
      ...location,
      description: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Prepare data for submission
      const postData = {
        ...formData,
        location: location,
      };

      // Submit the post
      const response = await axios.post("/api/posts", postData);

      // Redirect based on post type
      if (response.data.type === 'vet-request') {
        // For vet consultant requests, redirect to profile page with a success message
        router.push('/profile?success=vet-request');
      } else {
        // For regular posts, redirect to the post page
        router.push(`/posts/${response.data.data._id}`);
      }
    } catch (err) {
      console.error("Error creating post:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to create post. Please try again."
        );
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create Pet Post
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Post Type Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Post Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["missing", "emergency", "wounded", "vet-consultant"].map((type) => (
                  <div key={type} className="relative">
                    <input
                      type="radio"
                      id={`type-${type}`}
                      name="postType"
                      value={type}
                      checked={formData.postType === type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postType: e.target.value,
                        })
                      }
                      className="sr-only"
                      required
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className={`block w-full p-4 text-center rounded-lg border ${
                        formData.postType === type
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      } cursor-pointer transition-colors`}
                    >
                      {type === "vet-consultant" ? "Vet Consultant" : type.charAt(0).toUpperCase() + type.slice(1) + " Pet"}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Post Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="E.g., Missing Golden Retriever in Central Park"
                />
              </div>

              <div>
                <label
                  htmlFor="petName"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Pet Name *
                </label>
                <input
                  type="text"
                  id="petName"
                  name="petName"
                  value={formData.petName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Pet's name"
                />
              </div>
            </div>

            {/* Pet Details */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="petType"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Pet Type *
                </label>
                <input
                  type="text"
                  id="petType"
                  name="petType"
                  value={formData.petType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="E.g., Dog, Cat, Bird"
                />
              </div>

              <div>
                <label
                  htmlFor="petBreed"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Breed
                </label>
                <input
                  type="text"
                  id="petBreed"
                  name="petBreed"
                  value={formData.petBreed}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., Golden Retriever, Siamese"
                />
              </div>

              <div>
                <label
                  htmlFor="petAge"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Age
                </label>
                <input
                  type="text"
                  id="petAge"
                  name="petAge"
                  value={formData.petAge}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., 2 years, 6 months"
                />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="petGender"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Gender
                </label>
                <select
                  id="petGender"
                  name="petGender"
                  value={formData.petGender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="petColor"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Color
                </label>
                <input
                  type="text"
                  id="petColor"
                  name="petColor"
                  value={formData.petColor}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., Golden, Black and White"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-gray-700 font-medium mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Provide details about the pet and the situation"
              ></textarea>
            </div>

            {/* Last Seen Date (for missing pets) */}
            {formData.postType === "missing" && (
              <div className="mb-6">
                <label
                  htmlFor="lastSeenDate"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Last Seen Date *
                </label>
                <input
                  type="datetime-local"
                  id="lastSeenDate"
                  name="lastSeenDate"
                  value={formData.lastSeenDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Contact Information */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your contact phone number"
                />
              </div>

              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your contact email"
                />
              </div>
            </div>

            {/* Location Map */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Location *
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Click on the map to set the location where the pet was last seen
                or found.
              </p>

              <div
                style={mapContainerStyle}
                className="rounded-md overflow-hidden"
              >
                <LeafletMap
                  center={userLocation || defaultCenter}
                  marker={[
                    location.coordinates[0] ?? defaultCenter.lng,
                    location.coordinates[1] ?? defaultCenter.lat,
                  ]}
                  onMapClick={handleMapClick}
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="locationDescription"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Location Description
                </label>
                <textarea
                  id="locationDescription"
                  value={location.description}
                  onChange={handleLocationDescChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., Near the playground in Central Park"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Creating..." : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
