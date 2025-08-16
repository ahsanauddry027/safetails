// scripts/create-admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safetails', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema (simplified for the script)
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
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@safetails.com',
      password: hashedPassword,
      role: 'admin',
      phone: '',
      address: '',
      bio: 'System Administrator',
      isActive: true,
      isBlocked: false,
      isEmailVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Role:', adminUser.role);
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createAdminUser();
