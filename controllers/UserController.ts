// controllers/UserController.ts
import User from "@/models/User";
import bcrypt from "bcryptjs";

export class UserController {
  // Get all users with statistics
  static async getAllUsers(excludeAdminId?: string) {
    try {
      const query = excludeAdminId ? { _id: { $ne: excludeAdminId } } : {};
      
      const users = await User.find(query)
        .select("-password")
        .populate("blockedBy", "name email")
        .sort({ createdAt: -1 });

      // Group users by role
      const groupedUsers = {
        users: users.filter(user => user.role === "user"),
        vets: users.filter(user => user.role === "vet"),
        admins: users.filter(user => user.role === "admin"),
        blocked: users.filter(user => user.isBlocked),
        total: users.length
      };

      const stats = {
        totalUsers: groupedUsers.users.length,
        totalVets: groupedUsers.vets.length,
        totalAdmins: groupedUsers.admins.length,
        totalBlocked: groupedUsers.blocked.length,
        totalActive: users.length - groupedUsers.blocked.length
      };

      return { success: true, users: groupedUsers, stats };
    } catch (error) {
      console.error("Get all users error:", error);
      throw new Error("Failed to fetch users");
    }
  }

  // Get user by ID
  static async getUserById(userId: string) {
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      console.error("Get user by ID error:", error);
      throw error;
    }
  }

  // Create new user
  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    address?: string;
    bio?: string;
  }) {
    try {
      const { password, ...userFields } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        ...userFields,
        password: hashedPassword,
        role: userFields.role || "user"
      });

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      console.error("Create user error:", error);
      throw new Error("Failed to create user");
    }
  }

  // Update user
  static async updateUser(userId: string, updateData: {
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
    address?: string;
    bio?: string;
  }) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  }

  // Block/Unblock user
  static async toggleUserBlock(userId: string, isBlocked: boolean, adminId: string, blockReason?: string) {
    try {
      const updateData: any = {
        isBlocked: isBlocked,
        blockedBy: isBlocked ? adminId : null,
        blockedAt: isBlocked ? new Date() : null,
        blockReason: isBlocked ? blockReason : null
      };

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select("-password");

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Toggle user block error:", error);
      throw error;
    }
  }

  // Soft delete user
  static async deleteUser(userId: string) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      console.error("Delete user error:", error);
      throw error;
    }
  }

  // Authenticate user
  static async authenticateUser(email: string, password: string) {
    try {
      const user = await User.findOne({ email, isActive: true, isBlocked: false });
      
      if (!user) {
        throw new Error("User not found or account is blocked");
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error("Invalid password");
      }

      return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        profileImage: user.profileImage
      };
    } catch (error) {
      console.error("Authenticate user error:", error);
      throw error;
    }
  }

  // Get user by token
  static async getUserByToken(userId: string) {
    try {
      const user = await User.findById(userId).select("-password");
      
      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      return user;
    } catch (error) {
      console.error("Get user by token error:", error);
      throw error;
    }
  }

  // Check if email exists
  static async checkEmailExists(email: string, excludeUserId?: string) {
    try {
      const query = excludeUserId 
        ? { email, _id: { $ne: excludeUserId } }
        : { email };
      
      const existingUser = await User.findOne(query);
      return !!existingUser;
    } catch (error) {
      console.error("Check email exists error:", error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStatistics() {
    try {
      const totalUsers = await User.countDocuments({ role: "user", isActive: true });
      const totalVets = await User.countDocuments({ role: "vet", isActive: true });
      const totalAdmins = await User.countDocuments({ role: "admin", isActive: true });
      const totalBlocked = await User.countDocuments({ isBlocked: true, isActive: true });
      const totalActive = await User.countDocuments({ isActive: true, isBlocked: false });

      return {
        totalUsers,
        totalVets,
        totalAdmins,
        totalBlocked,
        totalActive
      };
    } catch (error) {
      console.error("Get user statistics error:", error);
      throw new Error("Failed to get user statistics");
    }
  }

  // Get all users with statistics (for admin dashboard)
  static async getAllUsersForAdmin(excludeAdminId?: string) {
    try {
      const query = excludeAdminId ? { _id: { $ne: excludeAdminId } } : {};
      
      const users = await User.find(query)
        .select("-password")
        .populate("blockedBy", "name email")
        .sort({ createdAt: -1 });

      // Group users by role
      const groupedUsers = {
        users: users.filter(user => user.role === "user"),
        vets: users.filter(user => user.role === "vet"),
        admins: users.filter(user => user.role === "admin"),
        blocked: users.filter(user => user.isBlocked),
        total: users.length
      };

      // Get complete statistics including current admin
      const stats = await this.getUserStatistics();

      return { success: true, users: groupedUsers, stats };
    } catch (error) {
      console.error("Get all users error:", error);
      throw new Error("Failed to fetch users");
    }
  }
} 