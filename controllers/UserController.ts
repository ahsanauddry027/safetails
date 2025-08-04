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
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
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
      const updateData: {
        isBlocked: boolean;
        blockedBy: string | null;
        blockedAt: Date | null;
        blockReason: string | null;
      } = {
        isBlocked: isBlocked,
        blockedBy: isBlocked ? adminId : null,
        blockedAt: isBlocked ? new Date() : null,
        blockReason: isBlocked ? blockReason || null : null
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
      // First check if user exists at all
      const userExists = await User.findOne({ email });
      
      if (!userExists) {
        throw new Error("User not found");
      }
      
      // Then check if user is inactive
      if (!userExists.isActive) {
        throw new Error("Account is inactive");
      }
      
      // Then check if user is blocked
      if (userExists.isBlocked) {
        throw new Error("Account is blocked");
      }
      
      // Now we know the user exists, is active and not blocked
      const validPassword = await bcrypt.compare(password, userExists.password);
      if (!validPassword) {
        throw new Error("Invalid password");
      }

      return {
        id: userExists._id,
        email: userExists.email,
        name: userExists.name,
        role: userExists.role,
        phone: userExists.phone,
        address: userExists.address,
        bio: userExists.bio,
        profileImage: userExists.profileImage
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

  // Verify email with OTP
  static async verifyEmail(email: string, otp: string) {
    try {
      const user = await User.findOne({
        email,
        emailVerificationToken: otp,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new Error("Invalid or expired OTP");
      }

      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return {
        success: true,
        message: "Email verified successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      };
    } catch (error) {
      console.error("Verify email error:", error);
      throw error;
    }
  }

  // Resend verification email
  static async resendVerificationEmail(email: string) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error("User not found");
      }

      if (user.isEmailVerified) {
        throw new Error("Email is already verified");
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      user.emailVerificationToken = otp;
      user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      return {
        success: true,
        otp,
        user: {
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      console.error("Resend verification email error:", error);
      throw error;
    }
  }

  // Generate password reset token
  static async generatePasswordResetToken(email: string) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error("User not found");
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      return {
        success: true,
        resetToken,
        user: {
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      console.error("Generate password reset token error:", error);
      throw error;
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string) {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return {
        success: true,
        message: "Password reset successfully"
      };
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }
}
