import React from "react";
import { formatDistanceToNow } from "date-fns";

interface AlertCardProps {
  alert: {
    _id: string;
    type: string;
    title: string;
    description: string;
    urgency: string;
    status: string;
    location: {
      address: string;
      city: string;
      state: string;
    };
    petDetails?: {
      petType: string;
      petBreed?: string;
      petColor?: string;
      petAge?: string;
      petGender?: string;
    };
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: string;
    expiresAt?: string;
  };
  onViewDetails: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  showActions?: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onViewDetails,
  onResolve,
  showActions = true,
}) => {
  const getUrgencyColor = (urgency: string) => {
    if (!urgency) return "bg-gray-100 text-gray-800 border-gray-200";

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
    if (!type) return "📢";

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

  const getTypeColor = (type: string) => {
    if (!type) return "bg-gray-100 text-gray-800 border-gray-200";

    switch (type) {
      case "lost_pet":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "found_pet":
        return "bg-green-100 text-green-800 border-green-200";
      case "foster_request":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200";
      case "adoption":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isExpired = alert.expiresAt && new Date(alert.expiresAt) < new Date();
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true,
  });

  // Ensure we have safe values for display
  const urgency = alert.urgency || "medium";
  const type = alert.type || "general";
  const createdByName = alert.createdBy?.name || "Unknown User";
  const location = alert.location || {};
  const address = location.address || "Address not specified";
  const city = location.city || "City not specified";
  const state = location.state || "State not specified";

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer ${
        isExpired ? "opacity-60" : ""
      }`}
      onClick={() => onViewDetails(alert._id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(type)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {alert.title}
            </h3>
            <p className="text-sm text-gray-600">Posted by {createdByName}</p>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full border ${getUrgencyColor(urgency)}`}
          >
            {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
          </span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full border ${getTypeColor(type)}`}
          >
            {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-3">{alert.description}</p>

      {alert.petDetails && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Pet Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Type:</span>{" "}
              {alert.petDetails.petType}
            </div>
            {alert.petDetails.petBreed && (
              <div>
                <span className="font-medium">Breed:</span>{" "}
                {alert.petDetails.petBreed}
              </div>
            )}
            {alert.petDetails.petColor && (
              <div>
                <span className="font-medium">Color:</span>{" "}
                {alert.petDetails.petColor}
              </div>
            )}
            {alert.petDetails.petAge && (
              <div>
                <span className="font-medium">Age:</span>{" "}
                {alert.petDetails.petAge}
              </div>
            )}
            {alert.petDetails.petGender && (
              <div>
                <span className="font-medium">Gender:</span>{" "}
                {alert.petDetails.petGender}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {address}, {city}, {state}
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {timeAgo}
          {alert.expiresAt && (
            <>
              <span className="mx-2">•</span>
              <span className={isExpired ? "text-red-600" : ""}>
                {isExpired
                  ? "Expired"
                  : `Expires ${formatDistanceToNow(new Date(alert.expiresAt), { addSuffix: true })}`}
              </span>
            </>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(alert._id);
            }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Details
          </button>

          {onResolve && alert.status === "active" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(alert._id);
              }}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Mark Resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertCard;
