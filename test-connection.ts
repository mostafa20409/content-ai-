// test-connection.ts
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';

async function testConnection() {
  try {
    await connectToDB();
    console.log('✅ Database connected successfully');
    
    // اختبار البحث عن مستخدم
    const user = await User.findOne({ email: 'test@example.com' });
    console.log('User found:', user);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();