// pages/delete-profile.tsx
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";

export default function DeleteProfilePage() {
  const { user, deleteProfile, loading } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleDelete = async () => {
    if (confirmation !== "DELETE") {
      alert("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProfile();
      router.push("/");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete profile. Please try again.";
      alert("Failed to delete profile. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Delete Profile
            </h1>
            <p className="text-gray-600">
              This action cannot be undone. All your data will be permanently
              deleted.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">
              What will be deleted:
            </h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Your personal information</li>
              <li>• Your account settings</li>
              <li>• All associated data</li>
              <li>• Your login access</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type &apos;DELETE&apos; to confirm
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmation !== "DELETE"}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-3 px-4 rounded-md transition duration-200"
            >
              {isDeleting ? "Deleting..." : "Delete Profile"}
            </button>

            <Link
              href="/profile"
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-4 rounded-md transition duration-200 text-center"
            >
              Cancel
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/profile"
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
