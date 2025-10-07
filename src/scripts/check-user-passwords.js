// scripts/check-user-passwords.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function checkUserPasswords() {
  try {
    // @ts-ignore
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      createdAt: Date
    }));

    // الحصول على جميع المستخدمين
    const users = await User.find().sort({ createdAt: 1 });
    
    console.log(`📊 Total users: ${users.length}`);
    console.log('================================');

    for (const user of users) {
      console.log(`👤 User: ${user.name} (${user.email})`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Password: ${user.password ? 'Exists' : 'Missing'}`);
      
      if (user.password) {
        console.log(`   Password length: ${user.password.length}`);
        console.log(`   Starts with $2b$: ${user.password.startsWith('$2b$')}`);
        
        // اختبار مع كلمة مرور افتراضية
        // @ts-ignore
        const testPasswords = ['password123', 'test123', '123456', user.name.toLowerCase()];
        let anyMatch = false;
        
        for (const testPassword of testPasswords) {
          try {
            const isMatch = await bcrypt.compare(testPassword, user.password);
            if (isMatch) {
              console.log(`   ✅ Password match: ${testPassword}`);
              anyMatch = true;
              break;
            }
          } catch (error) {
            // إذا فشل bcrypt، جرب المقارنة النصية
            if (testPassword === user.password) {
              console.log(`   ✅ Plain text match: ${testPassword}`);
              anyMatch = true;
              break;
            }
          }
        }
        
        if (!anyMatch) {
          console.log('   ❌ No password match found');
        }
      }
      console.log('--------------------------------');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// تشغيل الدالة
checkUserPasswords();