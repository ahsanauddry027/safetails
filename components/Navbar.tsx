// components/Navbar.tsx
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return (
      <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          SafeTails
        </Link>
        <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        SafeTails
      </Link>
      
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            {/* Role-specific navigation */}
            {user.role === "vet" && (
              <Link href="/vet-dashboard" className="hover:text-yellow-300">
                Vet Dashboard
              </Link>
            )}
            {user.role === "admin" && (
              <Link href="/admin-dashboard" className="hover:text-red-300">
                Admin Panel
              </Link>
            )}
            
            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:text-yellow-300"
              >
                <span>{user.name}</span>
                <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                  {user.role}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
                             {showDropdown && (
                 <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg py-2 z-50 border border-gray-200">
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
            <Link href="/login" className="hover:text-yellow-300">Login</Link>
            <Link href="/register" className="hover:text-yellow-300">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
