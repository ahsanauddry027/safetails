// components/Navbar.tsx
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 text-black px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <Link
          href="/"
          className="text-2xl font-bold tracking-wide hover:text-gray-600 transition-colors duration-200 font-display"
        >
          SafeTails
        </Link>
        <div className="loading-spinner"></div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 text-black px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
              <Link
          href="/"
          className="text-2xl font-bold tracking-wide hover:text-gray-600 transition-colors duration-200 font-display"
        >
          <span className="text-primary">Safe</span>Tails
        </Link>

      <div className="flex gap-6 items-center">
        {/* Common navigation links */}
        <Link
          href="/posts"
          className="px-4 py-2 rounded-xl hover:bg-gray-100 hover:text-black transition-all duration-200 font-semibold text-gray-700 hover:shadow-md"
        >
          Pet Posts
        </Link>

        {user ? (
          <>
            {/* Role-specific navigation */}
            {user.role === "vet" && (
              <Link
                href="/vet-dashboard"
                className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-black border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
              >
                <span className="relative z-10">Vet Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            )}
            {user.role === "admin" && (
              <Link
                href="/admin-dashboard"
                className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-black border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
              >
                <span className="relative z-10">Admin Panel</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            )}

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md font-semibold"
              >
                <span className="font-semibold text-gray-800">{user.name}</span>
                <span className="text-xs bg-black text-white px-3 py-1 rounded-full font-bold">
                  {user.role}
                </span>
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-white text-black rounded-2xl shadow-2xl py-3 z-50 border border-gray-200 animate-scale-in">
                  <Link
                    href="/profile"
                    className="block px-6 py-3 hover:bg-gray-50 text-black transition-colors duration-200 font-medium hover:text-primary"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      My Profile
                    </div>
                  </Link>
                  <Link
                    href="/edit-profile"
                    className="block px-6 py-3 hover:bg-gray-50 text-black transition-colors duration-200 font-medium hover:text-primary"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Profile
                    </div>
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        setShowDropdown(false);
                        // Redirect to home page after logout
                        window.location.href = "/";
                      } catch (error) {
                        console.error("Logout failed:", error);
                        alert("Logout failed. Please try again.");
                      }
                    }}
                    className="block w-full text-left px-6 py-3 hover:bg-red-50 text-red-600 transition-colors duration-200 font-medium hover:text-red-700"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </div>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center px-6 py-2 text-sm font-bold text-black bg-white border-2 border-black rounded-xl overflow-hidden transition-all duration-300"
            >
              <span className="relative z-20 duration-300">Login</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center px-6 py-2 text-sm font-bold text-white bg-black border-2 border-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-gray-800 hover:bg-gray-800 transform hover:-translate-y-1"
            >
              <span className="relative z-10">Register</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
