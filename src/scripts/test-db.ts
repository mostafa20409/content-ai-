// scripts/test-db.ts
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';

async function testDB() {
  try {
    await connectToDB();
    console.log('✅ MongoDB connected');
    
    // اختبار عد المستخدمين
    const count = await User.countDocuments();
    console.log(`📊 Total users: ${count}`);
    
    // اختبار البحث عن مستخدم
    const user = await User.findOne();
    console.log('👤 Sample user:', user);
    
  } catch (error) {
    console.error('❌ DB error:', error);
  }
}

testDB();