import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "vet" | "admin";
  phone?: string;
  address?: string;
  bio?: string;
  profileImage?: string;
  isBlocked?: boolean;
  blockedBy?: string;
  blockedAt?: string;
  blockReason?: string;
  createdAt?: string;
  isActive?: boolean;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  bio?: string;
};

type AuthContextType = {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  deleteProfile: () => Promise<void>;
  loading: boolean;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((res) => {
        if (res.data.user) {
          const userData = {
            id: res.data.user._id || res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            role: res.data.user.role,
            phone: res.data.user.phone,
            address: res.data.user.address,
            bio: res.data.user.bio,
            isBlocked: res.data.user.isBlocked || false,
            blockedBy: res.data.user.blockedBy,
            blockedAt: res.data.user.blockedAt,
            blockReason: res.data.user.blockReason,
            createdAt: res.data.user.createdAt,
            isActive: res.data.user.isActive,
          };

          if (userData.isBlocked) {
            setUser(null);
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return;
          }

          setUser(userData);
        }
      })
      .catch((error) => {
        if (
          error.response?.status === 403 &&
          error.response?.data?.error === "Account is blocked"
        ) {
          setUser(null);
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        } else {
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password });

      if (res.data.user) {
        const userData = {
          id: res.data.user._id || res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          phone: res.data.user.phone,
          address: res.data.user.address,
          bio: res.data.user.bio,
          isBlocked: res.data.user.isBlocked || false,
          blockedBy: res.data.user.blockedBy,
          blockedAt: res.data.user.blockedAt,
          blockReason: res.data.user.blockReason,
          createdAt: res.data.user.createdAt,
          isActive: res.data.user.isActive,
        };

        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Invalid response format" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const res = await axios.put("/api/profile/update", profileData);
      if (res.data.user) {
        const userData = {
          id: res.data.user._id || res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          phone: res.data.user.phone,
          address: res.data.user.address,
          bio: res.data.user.bio,
          isBlocked: res.data.user.isBlocked || false,
          blockedBy: res.data.user.blockedBy,
          blockedAt: res.data.user.blockedAt,
          blockReason: res.data.user.blockReason,
          createdAt: res.data.user.createdAt,
          isActive: res.data.user.isActive,
        };
        setUser(userData);
      }
    } catch (error) {
      throw new Error("Failed to update profile");
    }
  };

  const deleteProfile = async () => {
    try {
      await axios.delete("/api/profile/delete");
    } catch (error) {
      // Continue with deletion even if API call fails
    } finally {
      setUser(null);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const res = await axios.post("/api/auth/register", userData);

      if (res.data.user) {
        const newUser = {
          id: res.data.user._id || res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          phone: res.data.user.phone,
          address: res.data.user.address,
          bio: res.data.user.bio,
          isBlocked: res.data.user.isBlocked || false,
          blockedBy: res.data.user.blockedBy,
          blockedAt: res.data.user.blockedAt,
          blockReason: res.data.user.blockReason,
          createdAt: res.data.user.createdAt,
          isActive: res.data.user.isActive,
        };

        setUser(newUser);
        return { success: true };
      }
      return { success: false, error: "Invalid response format" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfile,
        deleteProfile,
        loading,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
