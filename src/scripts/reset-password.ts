// scripts/reset-password.ts
import { connectToDB } from '@/lib/connectToDB';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function resetPassword(email: string, newPassword: string) {
  try {
    await connectToDB();
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );
    
    console.log('✅ Password reset successfully');
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  }
}

// استبدل بالإيميل والباسوورد الجديد
resetPassword('test@example.com', 'newpassword123');