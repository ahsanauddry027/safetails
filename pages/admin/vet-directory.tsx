import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

type VetEntry = {
  _id: string;
  clinicName: string;
  specialization: string[];
  city: string;
  state: string;
  phone: string;
  isEmergencyAvailable: boolean;
  is24Hours: boolean;
  createdAt: string;
  vetId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
};

const AdminVetDirectoryPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [vetEntries, setVetEntries] = useState<VetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchVetEntries();
    }
  }, [user]);

  const fetchVetEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/vet-directory", {
        withCredentials: true,
      });
      setVetEntries(response.data.data || []);
    } catch (error) {
      console.error("Error fetching vet directory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVetEntry = async (vetEntryId: string) => {
    if (!confirm("Are you sure you want to delete this vet directory entry?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/vet-directory/${vetEntryId}`, {
        withCredentials: true,
      });
      setVetEntries((prev) => prev.filter((entry) => entry._id !== vetEntryId));
      alert("Vet directory entry deleted successfully");
    } catch (error) {
      console.error("Error deleting vet directory entry:", error);
      alert("Failed to delete vet directory entry");
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">
            Vet Directory Management
          </h1>
          <Link
            href="/admin-dashboard"
            className="px-6 py-3 text-white bg-black border-2 border-black rounded-2xl font-bold cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p>Loading vet directory...</p>
            </div>
          ) : vetEntries.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No vet directory entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clinic Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vetEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {entry.clinicName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {entry.vetId?.name ?? "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.vetId?.email ?? "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {entry.city}, {entry.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(entry.specialization ?? []).map((spec, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          {entry.isEmergencyAvailable && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Emergency
                            </span>
                          )}
                          {entry.is24Hours && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              24/7
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleDeleteVetEntry(entry._id)}
                            className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-md active:scale-95 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700"
                          >
                            <svg
                              className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110"
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
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVetDirectoryPage;
