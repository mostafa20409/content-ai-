// stabilityAI.ts
export class StabilityAI {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async generateImage(prompt: string, options: any = {}) {
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('output_format', options.output_format || 'webp');

      if (options.aspect_ratio) {
        formData.append('aspect_ratio', options.aspect_ratio);
      }

      // إضافة المعلمات الإضافية إذا تم توفيرها
      if (options.model) formData.append('model', options.model);
      if (options.mode) formData.append('mode', options.mode);
      if (options.seed) formData.append('seed', options.seed.toString());
      if (options.steps) formData.append('steps', options.steps.toString());
      if (options.cfg_scale) formData.append('cfg_scale', options.cfg_scale.toString());
      if (options.style_preset) formData.append('style_preset', options.style_preset);

      // استخدام endpoint الصحيح لـ SD3
      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'image/*'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Stability AI API error response:", errorText);
        throw new Error(`Stability AI API error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // إرجاع الصورة بصيغة base64 مع النوع الصحيح
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      return `data:image/${options.output_format || 'webp'};base64,${base64Image}`;

    } catch (error) {
      console.error("Stability AI generation error:", error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // دالة مساعدة لتوليد صور الأغلفة مع إعدادات محددة
  async generateBookCover(prompt: string): Promise<string> {
    return this.generateImage(prompt, {
      output_format: 'jpeg',
      aspect_ratio: '2:3', // تم التعديل إلى نسبة مدعومة
      model: 'sd3',
      mode: 'text-to-image',
      seed: 0,
      steps: 30,
      cfg_scale: 7,
      style_preset: 'enhance'
    });
  }

  // دالة مساعدة لتوليد صور الفصول مع إعدادات محددة
  async generateChapterIllustration(prompt: string): Promise<string> {
    return this.generateImage(prompt, {
      output_format: 'jpeg',
      aspect_ratio: '1:1', // تم التعديل إلى نسبة مدعومة
      model: 'sd3',
      mode: 'text-to-image',
      seed: 0,
      steps: 25,
      cfg_scale: 6,
      style_preset: 'line-art'
    });
  }
}