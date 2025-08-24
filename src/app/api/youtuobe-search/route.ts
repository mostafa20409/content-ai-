import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'كلمة البحث مطلوبة' },
        { status: 400 }
      );
    }

    const results = await searchYouTubeVideos(query);
    return NextResponse.json({ videos: results });

  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في البحث' },
      { status: 500 }
    );
  }
}

async function searchYouTubeVideos(query: string) {
  // المحاولة الأولى: استخدام YouTube API الرسمي
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=5&type=video&key=${process.env.YOUTUBE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.default.url,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));
      }
    } catch (error) {
      console.log('YouTube API failed, trying alternative...');
    }
  }

  // المحاولة الثانية: استخدام RapidAPI
  if (process.env.RAPIDAPI_KEY) {
    try {
      const response = await fetch(
        `https://youtube-search-results.p.rapidapi.com/youtube-search/?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'youtube-search-results.p.rapidapi.com'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
    } catch (error) {
      console.log('RapidAPI failed...');
    }
  }

  // نتائج افتراضية إذا فشلت جميع المحاولات
  return [{
    title: `ابحث عن "${query}" على YouTube`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    description: 'انقر للبحث مباشرة على YouTube'
  }];
}