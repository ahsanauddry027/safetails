// scripts/create-admin-simple.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB connection string - update this to match your setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safetails';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ["user", "vet", "admin"], default: "user" },
  phone: String,
  address: String,
  bio: String,
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@safetails.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email: admin@safetails.com');
      console.log('📧 Email: admin@safetails.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role:', existingAdmin.role);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@safetails.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890',
      address: 'Admin Address',
      bio: 'System Administrator',
      isActive: true,
      isBlocked: false,
      isEmailVerified: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@safetails.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', adminUser._id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser();
