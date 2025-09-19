// lib/utils.ts
export function canUserUseFeature(user: any, feature: string): boolean {
  const plan = user.subscription || 'free';
  const limits = user.subscriptionLimits || {};
  
  const featuresConfig = {
    'free': {
      'coverGeneration': false,
      'imageGeneration': false,
      'maxChapters': 3,
      'maxBooks': 5
    },
    'pro': {
      'coverGeneration': limits.coverGeneration > 0,
      'imageGeneration': limits.imageGeneration > 0,
      'maxChapters': 10,
      'maxBooks': 20
    },
    'premium': {
      'coverGeneration': limits.coverGeneration > 0,
      'imageGeneration': limits.imageGeneration > 0,
      'maxChapters': 50,
      'maxBooks': 100
    }
  };

  return featuresConfig[plan][feature] || false;
}

export function arabicToEnglishDescription(text: string): string {
  // دالة بسيطة لتحويل النص العربي إلى إنجليزي
  const translations: { [key: string]: string } = {
    'ديني': 'religious',
    'فلسفي': 'philosophical',
    'رعب': 'horror',
    'علمي': 'scientific',
    'تاريخي': 'historical',
    'أدبي': 'literary',
    'تطوير ذاتي': 'self development',
    'رومانسي': 'romance',
    'سيرة ذاتية': 'biography',
    'أطفال': 'children',
    'قصه حقيقيه': 'real story'
  };

  let result = text;
  Object.keys(translations).forEach(arabic => {
    result = result.replace(new RegExp(arabic, 'g'), translations[arabic]);
  });

  return result;
}