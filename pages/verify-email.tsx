// pages/verify-email.tsx
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isResending, setIsResending] = useState(false);

  const email = router.query.email as string; // Get email from query parameter

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("/api/auth/verify-email", { email, otp });
      router.push("/welcome"); // Redirect to welcome page upon success
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed");
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError("");
    setSuccess("");
    try {
      await axios.post("/api/auth/resend-verification", { email });
      setSuccess("OTP sent successfully! Please check your inbox.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-3xl mb-6 font-bold text-center text-gray-800">Verify Your Email</h2>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enter the OTP sent to your email address:
          </label>
          <input
            type="text"
            name="otp"
            placeholder="Enter OTP"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            value={otp}
            onChange={handleChange}
            required
          />
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        <button
          type="submit"
          className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
        >
          Verify OTP
        </button>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the OTP?
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-yellow-600 hover:text-yellow-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? "Sending..." : "Resend OTP"}
          </button>
        </div>
        
        {email && (
          <p className="mt-4 text-center text-xs text-gray-500">
            OTP sent to: {email}
          </p>
        )}
      </form>
    </div>
  );
}

