// scripts/check-password.ts
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';

async function checkPassword(email: string, password: string) {
  try {
    await connectToDB();
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('🔍 User password hash:', user.password);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Password match:', isMatch);
    
    // تجربة تشفير جديد لنفس الباسوورد
    const newHash = await bcrypt.hash(password, 10);
    console.log('🔄 New hash for same password:', newHash);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// استبدل بالإيميل والباسوورد الحقيقي
checkPassword('test@example.com', 'password123');