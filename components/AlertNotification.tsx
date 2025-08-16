import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface AlertNotificationProps {
  maxNotifications?: number;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
}

interface Alert {
  _id: string;
  type: string;
  title: string;
  urgency: string;
  location: {
    city: string;
    state: string;
  };
  createdAt: string;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({
  maxNotifications = 3,
  autoHide = true,
  hideAfter = 10000
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch nearby alerts for the user
      fetchNearbyAlerts();
      
      // Set up periodic refresh every 5 minutes
      const interval = setInterval(fetchNearbyAlerts, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNearbyAlerts = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            const response = await axios.get(`/api/alerts?latitude=${lat}&longitude=${lng}&radius=10&status=active&limit=${maxNotifications}`);
            
            if (response.data.success) {
              const newAlerts = response.data.data.filter((alert: Alert) => 
                !notifications.some(n => n._id === alert._id)
              );
              
              if (newAlerts.length > 0) {
                setNotifications(prev => [...newAlerts, ...prev].slice(0, maxNotifications));
                setUnreadCount(prev => prev + newAlerts.length);
                
                // Auto-hide notifications after specified time
                if (autoHide) {
                  setTimeout(() => {
                    setShowNotifications(false);
                  }, hideAfter);
                }
              }
            }
          },
          (error) => {
            console.log("Error getting location for alerts:", error);
          }
        );
      }
    } catch (error) {
      console.error("Error fetching nearby alerts:", error);
    }
  };

  const markAsRead = (alertId: string) => {
    setNotifications(prev => prev.filter(n => n._id !== alertId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📢';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lost_pet':
        return '🐕';
      case 'found_pet':
        return '🏠';
      case 'foster_request':
        return '🏡';
      case 'emergency':
        return '🚨';
      case 'adoption':
        return '❤️';
      default:
        return '📢';
    }
  };

  if (!user || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5h15a2.5 2.5 0 002.5-2.5V9.5a2.5 2.5 0 00-2.5-2.5h-15A2.5 2.5 0 002 9.5v7.5a2.5 2.5 0 002.5 2.5z" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Nearby Alerts</h3>
            <p className="text-sm text-gray-600">Recent pet-related activities in your area</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {notifications.map((alert) => (
              <div key={alert._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </span>
                      <span className="text-lg">{getUrgencyIcon(alert.urgency)}</span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {alert.location.city}, {alert.location.state}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(alert.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      
                      <button
                        onClick={() => markAsRead(alert._id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark as read
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <a
              href="/alerts"
              className="block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all alerts →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertNotification;
