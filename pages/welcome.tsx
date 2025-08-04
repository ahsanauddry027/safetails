// pages/welcome.tsx
import { useRouter } from "next/router";

export default function WelcomePage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl mb-4 font-bold text-gray-800">Welcome to SafeTails! 🐾</h2>
        </div>

        <div className="space-y-4 text-gray-600">
          <p className="text-lg">
            Congratulations! Your email has been successfully verified.
          </p>
          <p>
            You're now part of our amazing pet care community! You should also receive a welcome email with more information.
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🚀 What's Next?</h3>
          <ul className="text-sm text-blue-700 text-left space-y-1">
            <li>• Complete your profile</li>
            <li>• Share posts about your pets</li>
            <li>• Find veterinarians in your area</li>
            <li>• Connect with other pet lovers</li>
          </ul>
        </div>

        <button
          onClick={handleContinue}
          className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
        >
          Continue to Login
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Check your inbox for a welcome email with additional details!
        </p>
      </div>
    </div>
  );
}
