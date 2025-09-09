// app/api/research/route.ts
import { NextResponse } from 'next/server';

// أنواع البيانات
interface SearchResult {
  title: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  date?: string;
  author?: string;
  source: string;
}

interface ResearchResponse {
  success: boolean;
  data?: {
    [key: string]: SearchResult[];
  };
  error?: string;
  metadata?: {
    totalResults: number;
    searchTime: number;
    sourcesUsed: string[];
  };
}

// إعدادات البحث
const SEARCH_CONFIG = {
  timeout: 15000, // زيادة المهلة إلى 15 ثانية
  maxResults: 5, // أقصى عدد نتائج لكل مصدر
  fallbackEnabled: true // تمكين البحث الاحتياطي
};

// مهلات مخصصة لكل مصدر
const SOURCE_TIMEOUTS: { [key: string]: number } = {
  web: 10000,
  youtube: 10000,
  news: 10000,
  academic: 20000, // مهلة أطول للبحث الأكاديمي
  wikipedia: 10000
};

// ذاكرة تخزين مؤقت للطلبات
const requestCache = new Map();
const RATE_LIMIT = {
  MAX_REQUESTS: 5,
  WINDOW_MS: 60 * 1000 // 60 ثانية
};

// دالة للتحقق من معدل الطلبات
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  
  // تنظيف الطلبات القديمة
  for (const [key, timestamp] of requestCache.entries()) {
    if (timestamp < windowStart) {
      requestCache.delete(key);
    }
  }
  
  // عد الطلبات الحالية
  const requestCount = Array.from(requestCache.values()).filter(
    timestamp => timestamp >= windowStart
  ).length;
  
  if (requestCount >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  // إضافة الطلب الحالي
  requestCache.set(ip, now);
  return true;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const clientIP = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  try {
    // التحقق من معدل الطلبات
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'لقد تجاوزت عدد الطلبات المسموح بها. يرجى الانتظار قليلاً.'
        },
        { status: 429 }
      );
    }

    const { topic, sources = ['web', 'youtube', 'news'] } = await req.json();

    // التحقق من صحة البيانات
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'الموضوع مطلوب ويجب أن يكون نصياً'
        },
        { status: 400 }
      );
    }

    if (topic.length < 2 || topic.length > 100) {
      return NextResponse.json(
        { 
          success: false,
          error: 'الموضوع يجب أن يكون بين 2 و 100 حرف'
        },
        { status: 400 }
      );
    }

    // تنظيف topic من أي محتوى ضار
    const cleanTopic = topic.replace(/[<>]/g, '').trim();

    // جمع المعلومات من مصادر متعددة
    const researchData = await performResearch(cleanTopic, sources);

    const totalResults = Object.values(researchData).reduce(
      (total, results) => total + results.length, 0
    );

    const response: ResearchResponse = {
      success: true,
      data: researchData,
      metadata: {
        totalResults,
        searchTime: Date.now() - startTime,
        sourcesUsed: sources
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Research error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'حدث خطأ في جمع المعلومات',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

async function performResearch(topic: string, sources: string[]): Promise<{ [key: string]: SearchResult[] }> {
  const researchResults: { [key: string]: SearchResult[] } = {};
  const researchPromises: Promise<void>[] = [];

  for (const source of sources) {
    researchPromises.push(
      (async () => {
        try {
          switch (source) {
            case 'web':
              researchResults.web = await searchWithTimeout(() => searchWeb(topic), 'web');
              break;
            case 'youtube':
              researchResults.youtube = await searchWithTimeout(() => searchYouTube(topic), 'youtube');
              break;
            case 'news':
              researchResults.news = await searchWithTimeout(() => searchNews(topic), 'news');
              break;
            case 'academic':
              researchResults.academic = await searchWithTimeout(() => searchAcademic(topic), 'academic');
              break;
            case 'wikipedia':
              researchResults.wikipedia = await searchWithTimeout(() => searchWikipedia(topic), 'wikipedia');
              break;
            default:
              console.warn(`مصدر غير معروف: ${source}`);
          }
        } catch (error) {
          console.error(`Error searching ${source}:`, error);
          researchResults[source] = [];
        }
      })()
    );
  }

  // انتظار انتهاء جميع عمليات البحث
  await Promise.allSettled(researchPromises);

  return researchResults;
}

// دالة مساعدة للتعامل مع المهلات
async function searchWithTimeout<T>(
  searchFunction: () => Promise<T[]>,
  sourceName: string
): Promise<T[]> {
  try {
    const timeout = SOURCE_TIMEOUTS[sourceName] || SEARCH_CONFIG.timeout;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout exceeded for ${sourceName}`)), timeout)
    );

    return await Promise.race([searchFunction(), timeoutPromise]);
  } catch (error) {
    console.error(`Search timeout/error for ${sourceName}:`, error);
    return [];
  }
}

// البحث في الويب - محسّن مع معالجة الأخطاء
async function searchWeb(query: string): Promise<SearchResult[]> {
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    console.warn('Brave Search API key not configured');
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SOURCE_TIMEOUTS.web);

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`, // تقليل عدد النتائج لتجنب 429
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY,
          'User-Agent': 'Research-Assistant/1.0',
          'Accept-Language': 'ar,en;q=0.9'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (response.status === 429) {
      console.warn('Brave API rate limit exceeded');
      return []; // إرجاع مصفوفة فارغة بدلاً من الخطأ
    }

    if (!response.ok) {
      console.warn(`Brave API responded with status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    return data.web?.results?.slice(0, 3).map((result: any) => ({
      title: result.title,
      description: result.description,
      url: result.url,
      date: result.date,
      source: 'web'
    })) || [];

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Web search timed out');
    } else {
      console.error('Web search error:', error);
    }
    return [];
  }
}

// البحث في YouTube - محسّن
async function searchYouTube(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    // المحاولة الأولى: YouTube API الرسمي
    if (process.env.YOUTUBE_API_KEY) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SOURCE_TIMEOUTS.youtube);
        
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=3&type=video&key=${process.env.YOUTUBE_API_KEY}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          results.push(...(data.items || []).map((item: any) => ({
            title: item.snippet.title,
            description: item.snippet.description,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumbnail: item.snippet.thumbnails?.default?.url,
            date: item.snippet.publishedAt,
            author: item.snippet.channelTitle,
            source: 'youtube'
          })));
        }
      } catch (error) {
        console.log('YouTube API failed, trying alternative...');
      }
    }

    // إذا لم نحصل على نتائج كافية، نستخدم بحث Wikipedia كبديل
    if (results.length < 2) {
      try {
        const wikiResults = await searchWikipedia(query + " يوتيوب");
        results.push(...wikiResults.slice(0, 2).map(result => ({
          ...result,
          source: 'youtube'
        })));
      } catch (error) {
        console.log('YouTube fallback search failed...');
      }
    }

  } catch (error) {
    console.error('YouTube search error:', error);
  }

  return results.slice(0, 3);
}

// البحث في الأخبار - محسّن
async function searchNews(query: string): Promise<SearchResult[]> {
  if (!process.env.NEWS_API_KEY) {
    console.warn('News API key not configured');
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SOURCE_TIMEOUTS.news);

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&pageSize=3&apiKey=${process.env.NEWS_API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`News API responded with status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    return data.articles?.slice(0, 3).map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      thumbnail: article.urlToImage,
      date: article.publishedAt,
      author: article.author,
      source: 'news'
    })) || [];

  } catch (error) {
    console.error('News search error:', error);
    return [];
  }
}

// البحث الأكاديمي - محسّن
async function searchAcademic(query: string): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SOURCE_TIMEOUTS.academic);

    // استخدام CrossRef API للبحث الأكاديمي (مجاني)
    const response = await fetch(
      `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=3`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      
      return data.message?.items?.slice(0, 3).map((item: any) => ({
        title: item.title?.[0] || 'No title',
        description: item.abstract || `Published in: ${item['container-title']?.[0] || 'Unknown journal'}`,
        url: item.URL,
        date: item.created?.['date-time'],
        author: item.author?.map((a: any) => a.given + ' ' + a.family).join(', '),
        source: 'academic'
      })) || [];
    }
  } catch (error) {
    console.error('Academic search error:', error);
  }

  return [];
}

// بحث Wikipedia الجديد
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SOURCE_TIMEOUTS.wikipedia);

    const response = await fetch(
      `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&utf8=1`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      
      return data.query?.search?.map((item: any) => ({
        title: item.title,
        description: item.snippet,
        url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        source: 'wikipedia'
      })) || [];
    }
  } catch (error) {
    console.error('Wikipedia search error:', error);
  }

  return [];
}

// دالة للتحقق من توفر APIs
export async function GET() {
  const availableSources = {
    web: !!process.env.BRAVE_SEARCH_API_KEY,
    youtube: !!process.env.YOUTUBE_API_KEY,
    news: !!process.env.NEWS_API_KEY,
    academic: true, // CrossRef doesn't need API key
    wikipedia: true // Wikipedia doesn't need API key
  };

  return NextResponse.json({
    status: '🟢 API is operational',
    availableSources,
    maxResults: 3, // تقليل عدد النتائج
    timeout: SEARCH_CONFIG.timeout,
    sourceTimeouts: SOURCE_TIMEOUTS,
    rateLimit: {
      maxRequests: RATE_LIMIT.MAX_REQUESTS,
      windowMs: RATE_LIMIT.WINDOW_MS
    }
  });
}