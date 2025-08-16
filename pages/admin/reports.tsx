import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import axios from "axios";
import Head from "next/head";

interface Report {
  _id: string;
  postId: {
    _id: string;
    title: string;
    images: string[];
  };
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

const AdminReports = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Fetch reports
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchReports();
    }
  }, [currentPage, statusFilter, user]);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await axios.get(`/api/reports?status=${statusFilter}&page=${currentPage}&limit=10`);
      
      if (response.data.success) {
        setReports(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport || !actionStatus) return;

    try {
      await axios.put(`/api/reports?id=${selectedReport._id}`, {
        status: actionStatus,
        adminNotes: adminNotes || undefined
      });

      // Update local state
      setReports(prev => prev.map(report => 
        report._id === selectedReport._id 
          ? { ...report, status: actionStatus, adminNotes, reviewedBy: user, reviewedAt: new Date().toISOString() }
          : report
      ));

      setShowActionModal(false);
      setSelectedReport(null);
      setActionStatus("");
      setAdminNotes("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update report");
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "inappropriate_content":
        return "Inappropriate Content";
      case "spam":
        return "Spam";
      case "fake_information":
        return "Fake Information";
      case "harassment":
        return "Harassment";
      case "other":
        return "Other";
      default:
        return reason;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "dismissed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Reports - SafeTails</title>
        <meta name="description" content="Admin reports management" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Content Review</h1>
            <p className="text-gray-600 text-lg">Review and manage reported posts</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Reports</h3>
              <p className="text-3xl font-bold text-black">{total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {reports.filter(r => r.status === "pending").length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900">Reviewed</h3>
              <p className="text-3xl font-bold text-blue-600">
                {reports.filter(r => r.status === "reviewed").length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900">Resolved</h3>
              <p className="text-3xl font-bold text-green-600">
                {reports.filter(r => r.status === "resolved").length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Status Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-lg shadow-sm border">
            {loadingReports ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading reports...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchReports}
                  className="px-4 py-2 bg-black text-white rounded-md"
                >
                  Try Again
                </button>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No reports found for the selected status.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <div key={report._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(report.status)}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-800">
                            {getReasonLabel(report.reason)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-black mb-2">
                          Reported Post: {report.postId.title}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Reported by:</p>
                            <p className="text-black font-medium">{report.reportedBy.name}</p>
                            <p className="text-sm text-gray-500">{report.reportedBy.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Reported on:</p>
                            <p className="text-black">{formatDate(report.createdAt)}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Description:</p>
                          <p className="text-black">{report.description}</p>
                        </div>
                        
                        {report.adminNotes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">Admin Notes:</p>
                            <p className="text-black">{report.adminNotes}</p>
                          </div>
                        )}
                        
                        {report.reviewedBy && (
                          <div className="text-sm text-gray-500">
                            Reviewed by {report.reviewedBy.name} on {formatDate(report.reviewedAt!)}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowActionModal(true);
                          }}
                          className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium"
                        >
                          Take Action
                        </button>
                        <a
                          href={`/posts/${report.postId._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-200 text-black rounded-md text-sm font-medium text-center"
                        >
                          View Post
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-4 border">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300'
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
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
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
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-black">Take Action on Report</h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-500 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Action *
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  >
                    <option value="">Select an action</option>
                    <option value="reviewed">Mark as Reviewed</option>
                    <option value="resolved">Mark as Resolved</option>
                    <option value="dismissed">Dismiss Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Add notes about the action taken..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowActionModal(false)}
                    className="px-4 py-2 bg-gray-300 text-black rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!actionStatus}
                    className="px-4 py-2 bg-black text-white rounded-md disabled:bg-gray-400"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminReports;
