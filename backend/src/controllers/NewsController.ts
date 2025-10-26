import { Request, Response } from 'express';
// Database moved to Firebase - no MySQL connection needed
import { tsfNewsScraper, TSFNewsItem } from '../services/TSFNewsScraper';
import { chessComNewsScraper, ChessComNewsItem } from '../services/ChessComNewsScraper';

interface NewsItem {
  id: string | number;
  title: string;
  summary: string;
  content?: string;
  imageUrl?: string | null;
  originalUrl?: string;
  publishDate: Date;
  category: string;
  source: 'local' | 'tsf' | 'chesscom';
  importance?: number;
  tags?: string[];
}

// Cache for TSF news to avoid frequent scraping
let tsfNewsCache: TSFNewsItem[] = [];
let tsfLastScrapeTime = 0;

// Cache for Chess.com news
let chessComNewsCache: ChessComNewsItem[] = [];
let chessComLastScrapeTime = 0;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const getNews = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📰 Starting getNews request...', { query: req.query });
    const { source, limit = '20', refresh = 'false' } = req.query;
    let allNews: NewsItem[] = [];

    // Force refresh if requested
    const shouldRefresh = refresh === 'true';
    if (shouldRefresh) {
      console.log('🔄 Force refresh requested, clearing caches...');
      tsfNewsCache = [];
      tsfLastScrapeTime = 0;
      chessComNewsCache = [];
      chessComLastScrapeTime = 0;
    }

    // Get TSF news (with caching)
    if (!source || source === 'all' || source === 'tsf') {
      try {
        console.log('📡 Attempting to fetch TSF news...');
        const now = Date.now();
        
        // Use cache if fresh, otherwise scrape new data
        if (now - tsfLastScrapeTime > CACHE_DURATION || tsfNewsCache.length === 0) {
          console.log('🔄 Fetching fresh TSF news...');
          tsfNewsCache = await tsfNewsScraper.scrapeNews();
          tsfLastScrapeTime = now;
        } else {
          console.log('💾 Using cached TSF news...');
        }

        const tsfNews = tsfNewsCache.map(item => ({
          ...item,
          source: 'tsf' as const,
          content: item.summary,
          importance: 3 // Default importance for TSF news
        }));

        allNews.push(...tsfNews);
        console.log(`✅ Added ${tsfNews.length} TSF news items`);
      } catch (scrapeError) {
        console.error('❌ TSF scraping error:', scrapeError);
        console.log('⚠️ Continuing without TSF news...');
        // Continue without TSF news if scraping fails
      }
    }

    // Get Chess.com news (with caching)
    if (!source || source === 'all' || source === 'chesscom') {
      try {
        console.log('♟️ Attempting to fetch Chess.com news...');
        const now = Date.now();
        
        // Use cache if fresh, otherwise scrape new data
        if (now - chessComLastScrapeTime > CACHE_DURATION || chessComNewsCache.length === 0) {
          console.log('🔄 Fetching fresh Chess.com news...');
          chessComNewsCache = await chessComNewsScraper.scrapeNews();
          chessComLastScrapeTime = now;
        } else {
          console.log('💾 Using cached Chess.com news...');
        }

        const chessComNews = chessComNewsCache.map(item => ({
          ...item,
          source: 'chesscom' as const,
          content: item.summary
        }));

        allNews.push(...chessComNews);
        console.log(`✅ Added ${chessComNews.length} Chess.com news items`);
      } catch (scrapeError) {
        console.error('❌ Chess.com scraping error:', scrapeError);
        console.log('⚠️ Continuing without Chess.com news...');
        // Continue without Chess.com news if scraping fails
      }
    }

    // If no news was fetched from any source, provide fallback mock data
    if (allNews.length === 0) {
      console.log('⚠️ No news found from any source, providing fallback data...');
      allNews = getMinimalFallbackData();
    }

    // Sort by importance first, then by publish date (newest first)
    allNews.sort((a, b) => {
      const importanceA = a.importance || 3;
      const importanceB = b.importance || 3;
      
      if (importanceA !== importanceB) {
        return importanceB - importanceA; // Higher importance first
      }
      
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
    
    const limitNum = parseInt(limit as string, 10);
    if (limitNum > 0) {
      allNews = allNews.slice(0, limitNum);
    }

    console.log(`✅ Successfully returning ${allNews.length} news items`);
    res.json({
      success: true,
      count: allNews.length,
      data: allNews,
      lastUpdated: new Date().toISOString(),
      sources: allNews.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error) {
    console.error('❌ Critical error in getNews:', error);
    
    // Provide fallback mock data even in case of critical error
    const mockNews = getMinimalFallbackData();
    
    res.status(200).json({ // Return 200 instead of 500 to prevent frontend errors
      success: false,
      error: 'Haberleri getirirken hata oluştu, örnek veriler gösteriliyor.',
      count: mockNews.length,
      data: mockNews,
      lastUpdated: new Date().toISOString(),
      fallback: true
    });
  }
};

// Helper function to provide minimal fallback data when scraping fails
function getMinimalFallbackData(): NewsItem[] {
  return [
    {
      id: 'fallback-system',
      title: 'Haber Kaynakları Güncelleniyor',
      summary: 'Chess.com ve TSF kaynaklarından güncel haberler alınmaya çalışılıyor. Lütfen daha sonra tekrar kontrol edin.',
      content: 'Sistem şu anda Chess.com ve TSF kaynaklarından haberleri güncellemekle meşgul. Bu geçici bir durumdur.',
      imageUrl: 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=600&h=400&fit=crop',
      originalUrl: 'https://www.chess.com/news',
      publishDate: new Date(),
      category: 'Sistem',
      source: 'local' as const,
      importance: 2,
      tags: ['sistem', 'güncelleme']
    }
  ];
}

// Get featured news for homepage (top 5 most important from Chess.com)
export const getFeaturedNews = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('⭐ Starting getFeaturedNews request...', { query: req.query });
    const { limit = '5' } = req.query;
    
    // Get fresh Chess.com news for featured content
    const now = Date.now();
    if (now - chessComLastScrapeTime > CACHE_DURATION || chessComNewsCache.length === 0) {
      console.log('🔄 Fetching fresh Chess.com news for featured content...');
      try {
        chessComNewsCache = await chessComNewsScraper.scrapeNews();
        chessComLastScrapeTime = now;
        console.log(`✅ Scraped ${chessComNewsCache.length} Chess.com articles`);
      } catch (scrapeError) {
        console.error('❌ Failed to scrape Chess.com news:', scrapeError);
        // Use existing cache or fallback to mock data
        if (chessComNewsCache.length === 0) {
          console.log('⚠️ No cache available, using mock data for featured news...');
          const mockNews = getMinimalFallbackData().slice(0, parseInt(limit as string, 10));
          
          res.json({
            success: false,
            count: mockNews.length,
            data: mockNews,
            lastUpdated: new Date().toISOString(),
            source: 'Mock Data - Featured News (Scraping Failed)',
            fallback: true,
            error: 'Chess.com haberleri alınamadı, örnek veriler gösteriliyor.'
          });
          return;
        }
      }
    } else {
      console.log('💾 Using cached Chess.com news for featured content...');
    }

    // Sort by importance and take top items
    const featuredNews = [...chessComNewsCache]
      .sort((a, b) => {
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      })
      .slice(0, parseInt(limit as string, 10))
      .map(item => ({
        ...item,
        source: 'chesscom' as const,
        content: item.summary
      }));

    console.log(`✅ Successfully returning ${featuredNews.length} featured news items`);
    res.json({
      success: true,
      count: featuredNews.length,
      data: featuredNews,
      lastUpdated: new Date().toISOString(),
      source: 'Chess.com - Featured News'
    });
  } catch (error) {
    console.error('❌ Critical error getting featured news:', error);
    
    // Provide fallback mock data even in case of critical error
    const mockNews = getMinimalFallbackData().slice(0, parseInt(req.query.limit as string || '5', 10));
    
    res.status(200).json({ // Return 200 instead of 500 to prevent frontend errors
      success: false,
      error: 'Öne çıkan haberleri getirirken hata oluştu, örnek veriler gösteriliyor.',
      count: mockNews.length,
      data: mockNews,
      lastUpdated: new Date().toISOString(),
      source: 'Mock Data - Featured News (Critical Error)',
      fallback: true
    });
  }
};

// Force refresh TSF news cache
export const refreshTSFNews = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Force refreshing TSF news...');
    tsfNewsCache = await tsfNewsScraper.scrapeNews();
    tsfLastScrapeTime = Date.now();

    res.json({
      success: true,
      message: 'TSF haberleri başarıyla yenilendi',
      count: tsfNewsCache.length,
      data: tsfNewsCache
    });
  } catch (error) {
    console.error('Error refreshing TSF news:', error);
    res.status(500).json({
      success: false,
      error: 'TSF haberlerini yenilerken hata oluştu.'
    });
  }
};

// Force refresh Chess.com news cache
export const refreshChessComNews = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Force refreshing Chess.com news...');
    chessComNewsCache = await chessComNewsScraper.scrapeNews();
    chessComLastScrapeTime = Date.now();

    res.json({
      success: true,
      message: 'Chess.com haberleri başarıyla yenilendi',
      count: chessComNewsCache.length,
      data: chessComNewsCache
    });
  } catch (error) {
    console.error('Error refreshing Chess.com news:', error);
    res.status(500).json({
      success: false,
      error: 'Chess.com haberlerini yenilerken hata oluştu.'
    });
  }
};

// Get only TSF news
export const getTSFNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    
    // Use cache if available and fresh
    const now = Date.now();
    if (now - tsfLastScrapeTime > CACHE_DURATION || tsfNewsCache.length === 0) {
      tsfNewsCache = await tsfNewsScraper.scrapeNews();
      tsfLastScrapeTime = now;
    }

    let news = [...tsfNewsCache];
    const limitNum = parseInt(limit as string, 10);
    if (limitNum > 0) {
      news = news.slice(0, limitNum);
    }

    res.json({
      success: true,
      count: news.length,
      data: news,
      lastUpdated: new Date().toISOString(),
      source: 'TSF - Türkiye Satranç Federasyonu'
    });
  } catch (error) {
    console.error('Error getting TSF news:', error);
    res.status(500).json({
      success: false,
      error: 'TSF haberlerini getirirken hata oluştu.',
      data: []
    });
  }
};

// Get only Chess.com news
export const getChessComNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    
    // Use cache if available and fresh
    const now = Date.now();
    if (now - chessComLastScrapeTime > CACHE_DURATION || chessComNewsCache.length === 0) {
      chessComNewsCache = await chessComNewsScraper.scrapeNews();
      chessComLastScrapeTime = now;
    }

    let news = [...chessComNewsCache];
    const limitNum = parseInt(limit as string, 10);
    if (limitNum > 0) {
      news = news.slice(0, limitNum);
    }

    res.json({
      success: true,
      count: news.length,
      data: news,
      lastUpdated: new Date().toISOString(),
      source: 'Chess.com - International Chess News'
    });
  } catch (error) {
    console.error('Error getting Chess.com news:', error);
    res.status(500).json({
      success: false,
      error: 'Chess.com haberlerini getirirken hata oluştu.',
      data: []
    });
  }
};

// Haber ekleme, güncelleme, silme işlemleri için benzer fonksiyonlar ekleyin.
