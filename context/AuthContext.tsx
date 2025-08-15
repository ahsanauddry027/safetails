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
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  deleteProfile: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch((error) => {
        // If user is blocked, clear the user state and redirect to login
        if (error.response?.status === 403 && error.response?.data?.error === "Account is blocked") {
          console.log("User account is blocked, logging out");
          setUser(null);
          // Optionally redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
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
      setUser(res.data.user);
    } catch (error) {
      // Propagate the error to be handled by the login component
      throw error;
    }
  };

  const logout = async () => {
    await axios.post("/api/auth/logout");
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const res = await axios.put("/api/profile/update", profileData);
    setUser(res.data.user);
  };

  const deleteProfile = async () => {
    await axios.delete("/api/profile/delete");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateProfile, deleteProfile, loading }}
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
