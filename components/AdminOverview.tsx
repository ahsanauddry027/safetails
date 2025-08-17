// components/AdminOverview.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  newAdminsThisMonth: number;
  adminActivity: {
    userManagement: number;
    contentModeration: number;
    systemSettings: number;
    analytics: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    adminName: string;
    timestamp: string;
    details: string;
  }>;
}

interface AdminOverviewProps {
  onRefresh: () => void;
}

const AdminOverview = ({ onRefresh }: AdminOverviewProps) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users', { withCredentials: true });
      const adminUsers = response.data.users.admins || [];
      
      // Calculate stats from admin data
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const adminStats: AdminStats = {
        totalAdmins: adminUsers.length,
        activeAdmins: adminUsers.filter((admin: any) => admin.isActive).length,
        inactiveAdmins: adminUsers.filter((admin: any) => !admin.isActive).length,
        newAdminsThisMonth: adminUsers.filter((admin: any) => 
          new Date(admin.createdAt) >= monthStart
        ).length,
        adminActivity: {
          userManagement: adminUsers.filter((admin: any) => 
            admin.permissions?.userManagement
          ).length,
          contentModeration: adminUsers.filter((admin: any) => 
            admin.permissions?.contentModeration
          ).length,
          systemSettings: adminUsers.filter((admin: any) => 
            admin.permissions?.systemSettings
          ).length,
          analytics: adminUsers.filter((admin: any) => 
            admin.permissions?.analytics
          ).length,
        },
        recentActivity: [
          {
            id: '1',
            action: 'User Blocked',
            adminName: 'System Admin',
            timestamp: new Date().toISOString(),
            details: 'User account blocked for policy violation'
          },
          {
            id: '2',
            action: 'Content Moderated',
            adminName: 'Content Admin',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'Reported post reviewed and removed'
          },
          {
            id: '3',
            action: 'New Admin Created',
            adminName: 'Super Admin',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'New administrator account created'
          }
        ]
      };
      
      setStats(adminStats);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading admin overview...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load admin statistics.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-black flex items-center">
          <svg
            className="w-8 h-8 mr-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Admin Overview
        </h2>
        <button
          onClick={() => {
            fetchAdminStats();
            onRefresh();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium"
        >
          Refresh Stats
        </button>
      </div>

      {/* Admin Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Admins</p>
              <p className="text-3xl font-bold">{stats.totalAdmins}</p>
            </div>
            <div className="p-3 bg-red-400 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Admins</p>
              <p className="text-3xl font-bold">{stats.activeAdmins}</p>
            </div>
            <div className="p-3 bg-green-400 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">New This Month</p>
              <p className="text-3xl font-bold">{stats.newAdminsThisMonth}</p>
            </div>
            <div className="p-3 bg-yellow-400 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Inactive</p>
              <p className="text-3xl font-bold">{stats.inactiveAdmins}</p>
            </div>
            <div className="p-3 bg-purple-400 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Permission Distribution</h3>
          <div className="space-y-4">
            {Object.entries(stats.adminActivity).map(([permission, count]) => (
              <div key={permission} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {permission.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(count / stats.totalAdmins) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">
                    by {activity.adminName} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Create New Admin</p>
                <p className="text-xs text-blue-600">Add administrator account</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Manage Admins</p>
                <p className="text-xs text-green-600">View and edit admin accounts</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">View Analytics</p>
                <p className="text-xs text-purple-600">System performance metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
