// types/book.ts
export interface BookChapter {
  chapterNumber: number;
  title: string;
  description: string;
  content?: string;
}

export interface DesignCustomization {
  authorName: string;
  coverLayout: 'minimal' | 'modern' | 'classic' | 'elegant' | 'custom';
  colorScheme: {
    primary: string;
    secondary: string; 
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    titleSize: string;
    authorSize: string;
  };
  includeAuthorOnCover: boolean;
  customGraphics: string[];
  coverImageStyle: 'abstract' | 'realistic' | 'minimalist' | 'vintage';
}

export interface BookGenerationData {
  title: string;
  description: string;
  language: 'ar' | 'en';
  bookType: string;
  chapters: BookChapter[];
  includeExamples: boolean;
  generateCover: boolean;
  researchDepth: 'basic' | 'advanced' | 'academic';
  designOptions?: DesignCustomization;
  authorStyle: string;
  authorName: string;
}

export interface DesignOptions {
  layoutOptions: string[];
  colorPresets: {
    [key: string]: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
  fontOptions: string[];
  styleOptions: string[];
  writingStyles: string[];
  defaultDesign: DesignCustomization;
}