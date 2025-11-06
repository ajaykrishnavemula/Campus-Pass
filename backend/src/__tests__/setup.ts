import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Runs once before all tests
beforeAll(async () => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to it
    await mongoose.connect(mongoUri);
    
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
}, 30000); // 30 second timeout for setup

// Runs once after all tests
afterAll(async () => {
  try {
    // Disconnect and stop the server
    await mongoose.disconnect();
    await mongoServer.stop();
    
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database disconnection failed:', error);
  }
}, 30000);

// Runs after each test
afterEach(async () => {
  try {
    // Clear all collections to ensure test independence
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('❌ Failed to clear collections:', error);
  }
});

// 
