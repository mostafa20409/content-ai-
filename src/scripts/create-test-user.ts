// scripts/create-test-user.ts
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    await connectToDB();
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      active: true,
      role: 'user'
    });
    
    await user.save();
    console.log('✅ Test user created successfully');
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

createTestUser();