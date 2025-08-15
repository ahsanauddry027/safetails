// pages/register.tsx
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";

// Define registration form interface
interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  address: string;
  bio: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    role: "user",
    phone: "",
    address: "",
    bio: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await axios.post("/api/auth/register", form);
      router.push({ pathname: "/verify-email", query: { email: form.email } });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg border-4 border-gray-200 hover:border-black transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-black p-3 rounded-full">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-black mb-2">
            Join SafeTails 🐾
          </h2>
          <p className="text-gray-600 text-lg">
            Create your account to connect with pet lovers
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Name Field */}
              <div>
                <label className="flex text-lg font-semibold text-gray-700 mb-2 items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 bg-gray-50 focus:bg-white text-lg"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a strong password"
                    className="w-full p-4 pr-12 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center group"
                  >
                    {showPassword ? (
                      <svg className="w-6 h-6 text-gray-500 group-hover:text-black transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-500 group-hover:text-black transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="user">Pet Owner/Rescuer</option>
                  <option value="vet">Veterinarian</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Your phone number"
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Your address"
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-300 text-lg"
                  value={form.bio}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-8 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 text-lg transform hover:scale-105 hover:shadow-2xl"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="mt-6 text-center text-gray-600 text-lg">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-black hover:text-gray-700 font-bold transition-colors duration-300"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
