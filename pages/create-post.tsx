// pages/create-post.tsx
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
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
  petCategory: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  lastSeenDate: string;
  images: string[];
}

interface LocationData {
  coordinates: [number, number];
  address: string;
  description: string;
  city?: string;
  state?: string;
}

const CreatePost = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    petCategory: "",
    description: "",
    contactPhone: "",
    contactEmail: "",
    lastSeenDate: "",
    images: [],
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
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type (PNG, JPEG, JPG)
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          setError("Please select only PNG, JPEG, or JPG image files.");
          continue;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          setError("Image size must be less than 2MB.");
          continue;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Image = event.target?.result as string;
          console.log("Image converted to base64, length:", base64Image.length);
          
          try {
            // Upload image
            const response = await axios.post("/api/upload-image", {
              image: base64Image
            });

            if (response.data.success) {
              console.log("Image uploaded successfully, URL length:", response.data.imageUrl.length);
              setFormData(prev => ({
                ...prev,
                images: [...prev.images, response.data.imageUrl]
              }));
            }
          } catch (err) {
            console.error("Error uploading image:", err);
            setError("Failed to upload image. Please try again.");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Failed to process image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
        location: {
          ...location,
          city: location.city || "",
          state: location.state || "",
        },
        city: location.city || "",
        state: location.state || "",
      };

      console.log("Submitting post data:", {
        ...postData,
        images: postData.images.map((img, i) => `Image ${i + 1}: ${img.length} chars`)
      });

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner"></div>
        <p className="ml-4 text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-gray-200 hover:border-black transition-all duration-300">
          <h1 className="text-4xl font-bold text-black mb-8 text-center">
            Create Pet Post
          </h1>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Post Type Selection */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-4">
                Post Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      className={`block w-full p-4 text-center rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        formData.postType === type
                          ? "bg-black border-black text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-black hover:bg-gray-50"
                      }`}
                    >
                      {type === "vet-consultant" ? "Vet Consultant" : type.charAt(0).toUpperCase() + type.slice(1) + " Pet"}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-4">
                Pet Photos
              </label>
              <div className="space-y-4">
                {/* Image Upload Button */}
                <div className="relative">
                                     <input
                     ref={fileInputRef}
                     type="file"
                     multiple
                     accept="image/png,image/jpeg,image/jpg"
                     onChange={handleImageUpload}
                     className="hidden"
                     disabled={uploadingImage}
                   />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-black transition-all duration-300 text-center group"
                  >
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 group-hover:text-black transition-colors duration-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-lg font-semibold text-gray-600 group-hover:text-black transition-colors duration-300">
                        {uploadingImage ? "Uploading..." : "Click to upload pet photos"}
                      </p>
                                             <p className="text-sm text-gray-500 mt-2">
                         Upload up to 5 images (PNG, JPEG, JPG only, max 2MB each)
                       </p>
                    </div>
                  </button>
                </div>

                {/* Display Uploaded Images */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Pet photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-2xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Post Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  required
                  placeholder="E.g., Missing Golden Retriever in Central Park"
                />
              </div>

              <div>
                <label
                  htmlFor="petName"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Pet Name *
                </label>
                <input
                  type="text"
                  id="petName"
                  name="petName"
                  value={formData.petName}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  required
                  placeholder="Pet's name"
                />
              </div>
            </div>

            {/* Pet Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="petType"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Pet Type *
                </label>
                <input
                  type="text"
                  id="petType"
                  name="petType"
                  value={formData.petType}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  required
                  placeholder="E.g., Dog, Cat, Bird"
                />
              </div>

              <div>
                <label
                  htmlFor="petBreed"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Breed
                </label>
                <input
                  type="text"
                  id="petBreed"
                  name="petBreed"
                  value={formData.petBreed}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  placeholder="E.g., Golden Retriever, Siamese"
                />
              </div>

              <div>
                <label
                  htmlFor="petAge"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Age
                </label>
                <input
                  type="text"
                  id="petAge"
                  name="petAge"
                  value={formData.petAge}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  placeholder="E.g., 2 years, 6 months"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="petGender"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Gender
                </label>
                <select
                  id="petGender"
                  name="petGender"
                  value={formData.petGender}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                >
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="petColor"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Color
                </label>
                <input
                  type="text"
                  id="petColor"
                  name="petColor"
                  value={formData.petColor}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  placeholder="E.g., Golden, Black and White"
                />
              </div>
            </div>

            {/* Pet Category */}
            <div>
              <label
                htmlFor="petCategory"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Pet Category
              </label>
              <select
                id="petCategory"
                name="petCategory"
                value={formData.petCategory}
                onChange={handleChange}
                className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
              >
                <option value="">Select Pet Category</option>
                <option value="puppy">Puppy</option>
                <option value="adult">Adult</option>
                <option value="senior">Senior</option>
                <option value="kitten">Kitten</option>
                <option value="adult-cat">Adult Cat</option>
                <option value="senior-cat">Senior Cat</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                required
                placeholder="Provide details about the pet and the situation"
              ></textarea>
            </div>

            {/* Location Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="city"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={location.city || ""}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  required
                  placeholder="Enter city name"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={location.state || ""}
                  onChange={(e) => setLocation({ ...location, state: e.target.value })}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  required
                  placeholder="Enter state name"
                />
              </div>
            </div>

            {/* Last Seen Date (for missing pets) */}
            {formData.postType === "missing" && (
              <div>
                <label
                  htmlFor="lastSeenDate"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Last Seen Date *
                </label>
                <input
                  type="datetime-local"
                  id="lastSeenDate"
                  name="lastSeenDate"
                  value={formData.lastSeenDate}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  required
                />
              </div>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  placeholder="Your contact phone number"
                />
              </div>

              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  placeholder="Your contact email"
                />
              </div>
            </div>

            {/* Location Map */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Location *
              </label>
              <p className="text-gray-600 mb-4">
                Click on the map to set the location where the pet was last seen
                or found.
              </p>

              <div
                style={mapContainerStyle}
                className="rounded-2xl overflow-hidden border-2 border-gray-300"
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
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Location Description
                </label>
                <textarea
                  id="locationDescription"
                  value={location.description}
                  onChange={handleLocationDescChange}
                  rows={2}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  placeholder="E.g., Near the playground in Central Park"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/"
                className="px-8 py-4 border-2 border-gray-300 rounded-2xl text-gray-700 hover:border-black hover:bg-gray-50 transition-all duration-300 text-lg font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 bg-black text-white rounded-2xl transition-all duration-300 text-lg font-bold transform hover:scale-105 hover:shadow-2xl ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-800"
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
