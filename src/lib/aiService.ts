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

export const generateContent = async (title: string, genre: string, chaptersCount: number): Promise<GeneratedContent> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `أنت كاتب محترف متخصص في تأليف الكتب باللغة العربية. قم بإنشاء محتوى لكتاب بعنوان "${title}" من نوع ${genre}.`
        },
        {
          role: "user",
          content: `ألف كتابًا باللغة العربية بعنوان "${title}" من نوع ${genre} مكون من ${chaptersCount} فصول. قدم عناوين ومحتوى مفصل لكل فصل. المحتوى يجب أن يكون باللغة العربية ومناسب للثقافة العربية.`
        }
      ],
      model: "llama-3.1-8b-instant", // تم التعديل إلى نموذج متوفر ومضمون
      temperature: 0.7,
      max_tokens: 32000, // زيادة tokens للمحتوى الطويل
    });

    const content = completion.choices[0]?.message?.content;
    return parseGeneratedContent(content, title, genre, chaptersCount);
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("فشل في توليد المحتوى");
  }
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

function parseGeneratedContent(content: string | null, title: string, genre: string, chaptersCount: number): GeneratedContent {
  if (!content) {
    // إرجاع محتوى افتراضي إذا فشل التحليل
    const chapters: Chapter[] = Array.from({ length: chaptersCount }, (_, i) => ({
      title: `الفصل ${i + 1}: ${title}`,
      content: `هذا هو محتوى الفصل ${i + 1} من الكتاب "${title}" من نوع ${genre}. تم إنشاء هذا المحتوى تلقائيًا.`
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
        content: lines[i] || `محتوى الفصل ${i + 1} من الكتاب "${title}"`
      });
    }
    
    return { chapters, coverImage: "" };
  } catch (error) {
    console.error("Error parsing generated content:", error);
    // إرجاع محتوى افتراضي في حالة الخطأ
    const chapters: Chapter[] = Array.from({ length: chaptersCount }, (_, i) => ({
      title: `الفصل ${i + 1}: ${title}`,
      content: `محتوى الفصل ${i + 1} من الكتاب "${title}" من نوع ${genre}`
    }));
    
    return {
      chapters,
      coverImage: ""
    };
  }
}