// components/PasswordStrengthMeter.tsx
'use client';

import { useState, useEffect } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const [strength, setStrength] = useState<{ score: number; feedback: string }>({ score: 0, feedback: '' });

  useEffect(() => {
    const calculateStrength = () => {
      let score = 0;
      const feedback: string[] = [];
      
      if (password.length >= 8) score += 1;
      else feedback.push('8 أحرف على الأقل');
      
      if (/[A-Z]/.test(password)) score += 1;
      else feedback.push('حرف كبير واحد على الأقل');
      
      if (/[a-z]/.test(password)) score += 1;
      else feedback.push('حرف صغير واحد على الأقل');
      
      if (/\d/.test(password)) score += 1;
      else feedback.push('رقم واحد على الأقل');
      
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
      else feedback.push('رمز خاص واحد على الأقل');
      
      if (password.length >= 12) score += 1;
      
      setStrength({ 
        score, 
        feedback: feedback.length > 0 ? `مطلوب: ${feedback.join('، ')}` : 'كلمة المرور قوية' 
      });
    };
    
    calculateStrength();
  }, [password]);

  const getStrengthColor = () => {
    if (strength.score <= 2) return 'bg-red-500';
    if (strength.score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength.score <= 2) return 'ضعيفة';
    if (strength.score <= 4) return 'متوسطة';
    return 'قوية';
  };

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${getStrengthColor()}`} 
          style={{ width: `${(strength.score / 6) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className={`font-medium ${strength.score <= 2 ? 'text-red-500' : strength.score <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
          قوة كلمة المرور: {getStrengthText()}
        </span>
        {password.length > 0 && (
          <span className="text-gray-500">{strength.feedback}</span>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;