// aiService.ts
import Groq from "groq-sdk";
import { StabilityAI } from "./stabilityAI";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const stabilityAI = new StabilityAI({
  apiKey: process.env.STABILITY_AI_API_KEY!,
});

// تعريف واجهة للفصل
interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
}

// تعريف واجهة للنتيجة
interface GeneratedContent {
  chapters: Chapter[];
  coverImage: string;
}

// قائمة بالنماذج البديلة بالترتيب (نماذج Groq المتاحة حالياً)
const AVAILABLE_GROQ_MODELS = [
  "llama-3.1-8b-instant",           // النموذج الأساسي
  "llama-3.2-3b-preview",           // جديد
  "gemma2-9b-it",                   // بديل جيد
  "mixtral-8x7b-32768"              // احتياطي
];

// دالة محسنة لتوليد المحتوى مع fallback
async function generateContentWithFallback(title: string, genre: string, chaptersCount: number, userPlan: string = 'free'): Promise<GeneratedContent> {
  let lastError;
  
  // تحديد إعدادات الجودة بناء على خطة المستخدم
  const getPlanConfig = (plan: string) => {
    const plans = {
      'free': { minWords: 1800, temperature: 0.7, modelPriority: ['llama-3.1-8b-instant', 'gemma2-9b-it'] },
      'pro': { minWords: 2200, temperature: 0.75, modelPriority: ['llama-3.2-3b-preview', 'llama-3.1-8b-instant'] },
      'premium': { minWords: 2800, temperature: 0.8, modelPriority: ['llama-3.2-90b-vision-preview', 'llama-3.2-3b-preview'] }
    };
    return plans[plan] || plans.free;
  };

  const userConfig = getPlanConfig(userPlan);
  
  for (const model of userConfig.modelPriority) {
    try {
      console.log(`Trying model: ${model} for plan: ${userPlan}`);
      return await generateContentWithModel(title, genre, chaptersCount, model, userConfig);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed:`, error.message);
      continue;
    }
  }
  
  // إذا فشلت جميع النماذج المفضلة، جرب النماذج الاحتياطية
  const fallbackModels = AVAILABLE_GROQ_MODELS.filter(model => !userConfig.modelPriority.includes(model));
  for (const model of fallbackModels) {
    try {
      console.log(`Trying fallback model: ${model}`);
      return await generateContentWithModel(title, genre, chaptersCount, model, userConfig);
    } catch (error) {
      lastError = error;
      console.warn(`Fallback model ${model} failed:`, error.message);
      continue;
    }
  }
  
  throw lastError || new Error('All models failed');
}

// دالة لتوليد المحتوى باستخدام نموذج محدد
async function generateContentWithModel(title: string, genre: string, chaptersCount: number, model: string, userConfig: any): Promise<GeneratedContent> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `أنت كاتب محترف متخصص في تأليف الكتب باللغة العربية. 
                   قم بإنشاء محتوى لكتاب بعنوان "${title}" من نوع ${genre}.
                   المحتوى يجب أن يكون غنياً بالتفاصيل والحبكة والشخصيات.
                   الحد الأدنى للكلمات: ${userConfig.minWords} كلمة لكل فصل.`
        },
        {
          role: "user",
          content: `ألف كتابًا باللغة العربية بعنوان "${title}" من نوع ${genre} مكون من ${chaptersCount} فصول. 
                   قدم عناوين ومحتوى مفصل لكل فصل. 
                   المحتوى يجب أن يكون باللغة العربية ومناسب للثقافة العربية.
                   لا تقل عن ${userConfig.minWords} كلمة لكل فصل.
                   أضف حوارات وتفاصيل غنية.`
        }
      ],
      model: model,
      temperature: userConfig.temperature,
      max_tokens: 32000,
    });

    const content = completion.choices[0]?.message?.content;
    return parseGeneratedContent(content, title, genre, chaptersCount, userConfig.minWords);
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("فشل في توليد المحتوى");
  }
}

export const generateContent = async (title: string, genre: string, chaptersCount: number, userPlan: string = 'free'): Promise<GeneratedContent> => {
  return generateContentWithFallback(title, genre, chaptersCount, userPlan);
};

export const generateCoverImage = async (title: string, genre: string): Promise<string> => {
  try {
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `Classic black and white book cover titled "${title}", genre: ${genre}, professional design, high quality, Arabic style, cultural elements, elegant design, grayscale only, 2:3 aspect ratio`;
    return await stabilityAI.generateBookCover(prompt);
  } catch (error) {
    console.error("Stability AI API error:", error);
    throw new Error("فشل في توليد غلاف الكتاب");
  }
};

export const generateChapterImages = async (bookTitle: string, chapterTitle: string, genre: string): Promise<string> => {
  try {
    // استخدام الإنجليزية فقط لـ Stability AI
    const prompt = `Black and white illustration for chapter "${chapterTitle}" from book "${bookTitle}", genre: ${genre}, detailed drawing, Middle Eastern culture, elegant design, grayscale only, 1:1 aspect ratio`;
    return await stabilityAI.generateChapterIllustration(prompt);
  } catch (error) {
    console.error("Stability AI API error:", error);
    throw new Error("فشل في توليد صورة الفصل");
  }
};

function parseGeneratedContent(content: string | null, title: string, genre: string, chaptersCount: number, _minWords: number): GeneratedContent {
  if (!content) {
    // إرجاع محتوى افتراضي إذا فشل التحليل
    const chapters: Chapter[] = Array.from({ length: chaptersCount }, (_, i) => ({
      title: `الفصل ${i + 1}: ${title}`,
      content: `هذا هو محتوى الفصل ${i + 1} من الكتاب "${title}" من نوع ${genre}. تم إنشاء هذا المحتوى تلقائيًا. المحتوى يجب أن يكون غنياً بالتفاصيل والحبكة والشخصيات.`
    }));
    
    return {
      chapters,
      coverImage: ""
    };
  }

  try {
    // محاولة تحليل المحتوى المُولد
    const chapters: Chapter[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < chaptersCount; i++) {
      chapters.push({
        title: `الفصل ${i + 1}: ${title}`,
        content: lines[i] || `محتوى الفصل ${i + 1} من الكتاب "${title}". هذا المحتوى غني بالتفاصيل والحبكة.`
      });
    }
    
    return { chapters, coverImage: "" };
  } catch (error) {
    console.error("Error parsing generated content:", error);
    // إرجاع محتوى افتراضي في حالة الخطأ
    const chapters: Chapter[] = Array.from({ length: chaptersCount }, (_, i) => ({
      title: `الفصل ${i + 1}: ${title}`,
      content: `محتوى الفصل ${i + 1} من الكتاب "${title}" من نوع ${genre}. هذا المحتوى غني بالتفاصيل والحبكة والشخصيات.`
    }));
    
    return {
      chapters,
      coverImage: ""
    };
  }
}