// components/Navbar.tsx
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return (
      <nav className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-lg">
        <Link href="/" className="text-2xl font-bold tracking-wide hover:text-gray-300">
          SafeTails
        </Link>
        <div className="bg-gray-800 h-4 w-20 rounded"></div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-900 text-white px-4 py-4 flex justify-between items-center shadow-lg">
      <Link href="/" className="text-2xl font-bold tracking-wide hover:text-gray-300 transition-colors duration-200">
        SafeTails
      </Link>
      
      <div className="flex gap-6 items-center">
        {/* Common navigation links */}
        <Link href="/posts" className="px-3 py-2 rounded-md hover:bg-gray-800 hover:text-gray-200 transition-all duration-200 font-medium">
          Pet Posts
        </Link>
        
        {user ? (
          <>
            {/* Role-specific navigation */}
            {user.role === "vet" && (
              <Link href="/vet-dashboard" className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 font-medium">
                Vet Dashboard
              </Link>
            )}
            {user.role === "admin" && (
              <Link href="/admin-dashboard" className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white transition-all duration-200 font-medium">
                Admin Panel
              </Link>
            )}
            
            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-all duration-200"
              >
                <span className="font-medium">{user.name}</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full font-medium">
                  {user.role}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
                             {showDropdown && (
                 <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                   <Link 
                     href="/profile" 
                     className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                     onClick={() => setShowDropdown(false)}
                   >
                     My Profile
                   </Link>
                   <Link 
                     href="/edit-profile" 
                     className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                     onClick={() => setShowDropdown(false)}
                   >
                     Edit Profile
                   </Link>
                   <hr className="my-1 border-gray-200" />
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
                     className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                   >
                     Logout
                   </button>
                 </div>
               )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium">Login</Link>
            <Link href="/register" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 font-medium">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
