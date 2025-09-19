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
      formData.append('output_format', options.output_format || 'jpeg');

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

      const arrayBuffer = await response.arrayBuffer();
      
      // إرجاع الصورة بصيغة base64 مع النوع الصحيح
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      return `data:image/${options.output_format || 'jpeg'};base64,${base64Image}`;

    } catch (error) {
      console.error("Stability AI generation error:", error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // دالة مساعدة لتوليد صور الأغلفة مع إعدادات محددة
  async generateBookCover(prompt: string): Promise<string> {
    return this.generateImage(prompt, {
      output_format: 'jpeg',
      aspect_ratio: '2:3',
      model: 'sd3',
      mode: 'text-to-image',
      seed: 0,
      steps: 40,
      cfg_scale: 8,
      style_preset: 'enhance'
    });
  }

  // دالة مساعدة لتوليد صور الفصول مع إعدادات محددة
  async generateChapterIllustration(prompt: string): Promise<string> {
    return this.generateImage(prompt, {
      output_format: 'jpeg',
      aspect_ratio: '1:1',
      model: 'sd3',
      mode: 'text-to-image',
      seed: 0,
      steps: 30,
      cfg_scale: 7,
      style_preset: 'line-art'
    });
  }

  // دالة للتحقق من صحة API key
  async validateAPIKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error("API key validation error:", error);
      return false;
    }
  }

  // دالة للحصول على معلومات الحساب
  async getAccountInfo() {
    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get account info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Account info error:", error);
      throw error;
    }
  }

  // دالة للحصول على النماذج المتاحة
  async getAvailableModels() {
    try {
      const response = await fetch('https://api.stability.ai/v1/engines/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status}`);
      }

      const models = await response.json();
      return models.filter((model: any) => model.ready);
    } catch (error) {
      console.error("Models fetch error:", error);
      return [
        { id: 'sd3', name: 'Stable Diffusion 3', description: 'Latest SD3 model' },
        { id: 'sd3.5', name: 'Stable Diffusion 3.5', description: 'SD3.5 model' },
        { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL', description: 'Stable Diffusion XL' }
      ];
    }
  }

  // دالة لتوليد صورة مع خيارات متقدمة
  async generateAdvancedImage(
    prompt: string,
    options: {
      width?: number;
      height?: number;
      steps?: number;
      cfg_scale?: number;
      sampler?: string;
      seed?: number;
      style_preset?: string;
      output_format?: string;
    } = {}
  ): Promise<string> {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', options.output_format || 'jpeg');
    
    if (options.width && options.height) {
      formData.append('width', options.width.toString());
      formData.append('height', options.height.toString());
    }
    
    if (options.steps) formData.append('steps', options.steps.toString());
    if (options.cfg_scale) formData.append('cfg_scale', options.cfg_scale.toString());
    if (options.sampler) formData.append('sampler', options.sampler);
    if (options.seed) formData.append('seed', options.seed.toString());
    if (options.style_preset) formData.append('style_preset', options.style_preset);

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
      throw new Error(`Stability AI API error: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    return `data:image/${options.output_format || 'jpeg'};base64,${base64Image}`;
  }

  // دالة لتحويل الصور (Image-to-Image)
  async imageToImage(
    prompt: string,
    initImage: string, // base64 image
    options: {
      strength?: number;
      output_format?: string;
      steps?: number;
      cfg_scale?: number;
    } = {}
  ): Promise<string> {
    // إزالة data URL prefix إذا موجود
    const base64Data = initImage.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('init_image', new Blob([imageBuffer]));
    formData.append('output_format', options.output_format || 'jpeg');
    formData.append('strength', (options.strength || 0.7).toString());
    
    if (options.steps) formData.append('steps', options.steps.toString());
    if (options.cfg_scale) formData.append('cfg_scale', options.cfg_scale.toString());

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
      throw new Error(`Stability AI API error: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    return `data:image/${options.output_format || 'jpeg'};base64,${base64Image}`;
  }
}