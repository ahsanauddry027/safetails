// components/AdminManagement.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  bio?: string;
  permissions?: {
    userManagement: boolean;
    contentModeration: boolean;
    systemSettings: boolean;
    analytics: boolean;
  };
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AdminManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AdminManagement = ({ isOpen, onClose, onSuccess, onError }: AdminManagementProps) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
    }
  }, [isOpen]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users', { withCredentials: true });
      const adminUsers = response.data.users.admins || [];
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      onError('Failed to fetch admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = async (adminData: Partial<Admin>) => {
    if (!selectedAdmin?.id) return;

    try {
      await axios.put('/api/admin/update-user', {
        userId: selectedAdmin.id,
        ...adminData
      }, { withCredentials: true });

      onSuccess('Admin updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to update admin:', error);
      onError('Failed to update admin user');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin?.id) return;

    try {
      await axios.delete('/api/admin/delete-user', {
        data: { userId: selectedAdmin.id },
        withCredentials: true
      });

      onSuccess('Admin deleted successfully');
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
      onError('Failed to delete admin user');
    }
  };

  const handleToggleStatus = async (adminId: string, isActive: boolean) => {
    try {
      await axios.put('/api/admin/update-user', {
        userId: adminId,
        isActive: !isActive
      }, { withCredentials: true });

      onSuccess(`Admin ${isActive ? 'deactivated' : 'activated'} successfully`);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to toggle admin status:', error);
      onError('Failed to update admin status');
    }
  };

  const getFilteredAdmins = () => {
    let filtered = admins;

    if (searchTerm) {
      filtered = filtered.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(admin =>
        filterStatus === 'active' ? admin.isActive : !admin.isActive
      );
    }

    return filtered;
  };

  const getPermissionLabel = (permission: string) => {
    return permission.replace(/([A-Z])/g, ' $1').trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border-2 border-black w-full max-w-6xl shadow-2xl rounded-2xl bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-black">Admin Management</h3>
            <button
              onClick={onClose}
              className="text-black hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search admins by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={fetchAdmins}
                disabled={loading}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 font-medium disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Admins Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading admins...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredAdmins().map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {admin.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-black">{admin.name}</div>
                            <div className="text-sm text-gray-600">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {admin.phone && <div>📞 {admin.phone}</div>}
                          {admin.address && <div>📍 {admin.address}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions && Object.entries(admin.permissions).map(([key, value]) => (
                            <span
                              key={key}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                value
                                  ? 'bg-black text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {getPermissionLabel(key)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            admin.isActive
                              ? 'bg-black text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowEditModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                              admin.isActive
                                ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                                : 'bg-black hover:bg-gray-800 focus:ring-black'
                            }`}
                          >
                            {admin.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && getFilteredAdmins().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No admins found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border-2 border-black w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-black mb-4">Edit Admin User</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-black">Name</label>
                  <input
                    type="text"
                    defaultValue={selectedAdmin.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:border-black focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Email</label>
                  <input
                    type="email"
                    defaultValue={selectedAdmin.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:border-black focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Phone</label>
                  <input
                    type="text"
                    defaultValue={selectedAdmin.phone || ""}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:border-black focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Address</label>
                  <input
                    type="text"
                    defaultValue={selectedAdmin.address || ""}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:border-black focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Bio</label>
                  <textarea
                    defaultValue={selectedAdmin.bio || ""}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:border-black focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setSelectedAdmin({ ...selectedAdmin, bio: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditAdmin(selectedAdmin)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border-2 border-black w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-black mb-4">Delete Admin User</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {selectedAdmin.name}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
