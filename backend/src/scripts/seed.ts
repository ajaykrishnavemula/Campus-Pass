import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import { User } from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspass';

// Test users data
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@campuspass.com',
    password: 'admin123',
    role: 1, // Admin
    phone: '1234567890',
    isActive: true,
  },
  {
    name: 'John Doe',
    email: 'student@campuspass.com',
    password: 'student123',
    role: 0, // Student
    rollNumber: 'CS2021001',
    department: 'Computer Science',
    year: 3,
    hostel: 'Hostel A',
    roomNumber: '101',
    phone: '9876543210',
    isActive: true,
  },
  {
    name: 'Jane Smith',
    email: 'student2@campuspass.com',
    password: 'student123',
    role: 0, // Student
    rollNumber: 'CS2021002',
    department: 'Computer Science',
    year: 2,
    hostel: 'Hostel B',
    roomNumber: '205',
    phone: '9876543211',
    isActive: true,
  },
  {
    name: 'Warden Smith',
    email: 'warden@campuspass.com',
    password: 'warden123',
    role: 2, // Warden
    phone: '8765432109',
    isActive: true,
  },
  {
    name: 'Security Guard',
    email: 'security@campuspass.com',
    password: 'security123',
    role: 3, // Security
    phone: '7654321098',
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Existing users cleared');

    // Hash passwords and create users
    console.log('👥 Creating test users...');
    const usersWithHashedPasswords = await Promise.all(
      testUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
          ...user,
          password: hashedPassword,
        };
      })
    );

    await User.insertMany(usersWithHashedPasswords);
    console.log('✅ Test users created successfully!');

    // Display created users
    console.log('\n📋 Created Users:');
    console.log('=====================================');
    testUsers.forEach((user) => {
      const roleNames = ['Student', 'Admin', 'Warden', 'Security'];
      console.log(`\n${roleNames[user.role]}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Name: ${user.name}`);
      if (user.rollNumber) console.log(`  Roll Number: ${user.rollNumber}`);
      if (user.department) console.log(`  Department: ${user.department}`);
    });
    console.log('\n=====================================');

    console.log('\n✨ Database seeding completed successfully!');
    console.log('🚀 You can now start the backend server with: npm run dev');
    console.log('🌐 Frontend will be available at: http://localhost:5173');
    console.log('🔗 Backend API will be available at: http://localhost:3000');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

// 
