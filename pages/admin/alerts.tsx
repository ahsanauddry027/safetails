import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

type Alert = {
  _id: string;
  title: string;
  description: string;
  alertType: "emergency" | "warning" | "info";
  status: "active" | "expired" | "resolved";
  priority: "high" | "medium" | "low";
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
};

const AdminAlertsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/alerts", {
        withCredentials: true,
      });

      // Ensure we have valid data and add default values for missing fields
      const alertsData = response.data.data || [];
      const sanitizedAlerts = alertsData.map((alert: Partial<Alert>) => ({
        _id: alert._id || "",
        title: alert.title || "Untitled Alert",
        description: alert.description || "No description available",
        alertType: alert.alertType || "info",
        status: alert.status || "active",
        priority: alert.priority || "medium",
        createdAt: alert.createdAt || new Date().toISOString(),
        userId: alert.userId || {
          _id: "",
          name: "Unknown User",
          email: "unknown@example.com",
        },
      }));

      setAlerts(sanitizedAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/alerts/${alertId}`, {
        withCredentials: true,
      });
      setAlerts((prev) => prev.filter((alert) => alert._id !== alertId));
      alert("Alert deleted successfully");
    } catch (error) {
      console.error("Error deleting alert:", error);
      alert("Failed to delete alert");
    }
  };

  const getAlertTypeBadgeClass = (type: string | undefined) => {
    if (!type) return "bg-gray-100 text-gray-800";

    switch (type) {
      case "emergency":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeClass = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeClass = (priority: string | undefined) => {
    if (!priority) return "bg-gray-100 text-gray-800";

    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold text-black">Alerts Management</h1>
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
              <p>Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No alerts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alert Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {alert.title}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          {alert.description}
                        </div>
                        <div className="flex space-x-2">
                          {alert.alertType && (
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAlertTypeBadgeClass(alert.alertType)}`}
                            >
                              {alert.alertType.charAt(0).toUpperCase() +
                                alert.alertType.slice(1)}
                            </span>
                          )}
                          {alert.status && (
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(alert.status)}`}
                            >
                              {alert.status.charAt(0).toUpperCase() +
                                alert.status.slice(1)}
                            </span>
                          )}
                          {alert.priority && (
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(alert.priority)}`}
                            >
                              {alert.priority.charAt(0).toUpperCase() +
                                alert.priority.slice(1)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {alert.userId.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {alert.userId.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-3">
                          <Link
                            href={`/alerts/${alert._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteAlert(alert._id)}
                            className="text-red-600 hover:text-red-900"
                          >
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

export default AdminAlertsPage;
