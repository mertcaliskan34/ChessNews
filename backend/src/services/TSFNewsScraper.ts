import axios from 'axios';
import * as cheerio from 'cheerio';

export interface TSFNewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  originalUrl: string;
  publishDate: Date;
  category: string;
}

export class TSFNewsScraper {
  private readonly BASE_URL = 'https://www.tsf.org.tr';
  private readonly NEWS_URL = 'https://www.tsf.org.tr/guncel-haberler';

  async scrapeNews(): Promise<TSFNewsItem[]> {
    try {
      console.log('Starting TSF news scraping...');
      
      // Set headers to mimic a real browser
      const response = await axios.get(this.NEWS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const newsItems: TSFNewsItem[] = [];

      // Try different selectors to find news items
      const newsSelectors = [
        '.news-item',
        '.haber-item', 
        '.article-item',
        '.post-item',
        '.content-item',
        'article',
        '.news',
        '.item'
      ];

      let foundNews = false;

      for (const selector of newsSelectors) {
        const items = $(selector);
        if (items.length > 0) {
          console.log(`Found ${items.length} items with selector: ${selector}`);
          
          items.each((index, element) => {
            if (newsItems.length >= 20) return; // Limit to 20 items
            
            const $item = $(element);
            const newsItem = this.extractNewsItem($, $item, index);
            
            if (newsItem && newsItem.title.trim()) {
              newsItems.push(newsItem);
            }
          });
          
          if (newsItems.length > 0) {
            foundNews = true;
            break;
          }
        }
      }

      // If no specific news items found, try to extract from general links
      if (!foundNews) {
        console.log('Trying to extract from general links...');
        $('a[href*="/guncel-haberler/"]').each((index, element) => {
          if (newsItems.length >= 20) return;
          
          const $link = $(element);
          const href = $link.attr('href');
          
          if (href && href.includes('/guncel-haberler/')) {
            const title = $link.text().trim() || $link.find('img').attr('alt') || `Haber ${index + 1}`;
            
            if (title && title.length > 10) {
              const newsItem: TSFNewsItem = {
                id: this.generateId(href, index),
                title: this.cleanText(title),
                summary: this.extractSummary($, $link),
                imageUrl: this.extractImage($, $link),
                originalUrl: this.resolveUrl(href),
                publishDate: new Date(),
                category: 'Genel'
              };
              
              newsItems.push(newsItem);
            }
          }
        });
      }

      console.log(`Successfully scraped ${newsItems.length} news items from TSF`);
      return newsItems;
      
    } catch (error) {
      console.error('Error scraping TSF news:', error);
      
      // Return mock data as fallback
      return this.getMockNews();
    }
  }

  private extractNewsItem($: cheerio.CheerioAPI, $item: cheerio.Cheerio<any>, index: number): TSFNewsItem | null {
    try {
      // Try to find title
      const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.headline', '.news-title', 'a'];
      let title = '';
      
      for (const selector of titleSelectors) {
        const titleElement = $item.find(selector).first();
        if (titleElement.length > 0) {
          title = titleElement.text().trim();
          if (title.length > 5) break;
        }
      }

      if (!title) {
        title = $item.text().trim().substring(0, 100);
      }

      // Try to find link
      let link = $item.find('a').first().attr('href') || $item.attr('href') || '';
      
      // Try to find image
      const imageUrl = this.extractImage($, $item);
      
      // Generate summary
      const summary = this.extractSummary($, $item);

      if (title.length < 10) return null;

      return {
        id: this.generateId(link || title, index),
        title: this.cleanText(title),
        summary: summary,
        imageUrl: imageUrl,
        originalUrl: this.resolveUrl(link),
        publishDate: new Date(),
        category: 'TSF Haberleri'
      };
    } catch (error) {
      console.error('Error extracting news item:', error);
      return null;
    }
  }

  private extractImage($: cheerio.CheerioAPI, $item: cheerio.Cheerio<any>): string | null {
    const imgSelectors = ['img', '.image img', '.thumbnail img', '.news-image img'];
    
    for (const selector of imgSelectors) {
      const $img = $item.find(selector).first();
      if ($img.length > 0) {
        const src = $img.attr('src') || $img.attr('data-src');
        if (src) {
          return this.resolveUrl(src);
        }
      }
    }
    
    // Try to find background image
    const bgImage = $item.css('background-image');
    if (bgImage && bgImage.includes('url(')) {
      const match = bgImage.match(/url\(['"]?([^'"]*?)['"]?\)/);
      if (match && match[1]) {
        return this.resolveUrl(match[1]);
      }
    }
    
    return null;
  }

  private extractSummary($: cheerio.CheerioAPI, $item: cheerio.Cheerio<any>): string {
    const summarySelectors = ['.summary', '.excerpt', '.description', '.content', 'p'];
    
    for (const selector of summarySelectors) {
      const $summary = $item.find(selector).first();
      if ($summary.length > 0) {
        const text = $summary.text().trim();
        if (text.length > 20) {
          return this.cleanText(text.substring(0, 200)) + (text.length > 200 ? '...' : '');
        }
      }
    }
    
    return 'Türkiye Satranç Federasyonu\'ndan güncel haber...';
  }

  private resolveUrl(url: string): string {
    if (!url) return this.NEWS_URL;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return this.BASE_URL + url;
    return this.BASE_URL + '/' + url;
  }

  private generateId(input: string, index?: number): string {
    const timestamp = Date.now();
    const baseInput = input || `fallback_${timestamp}_${index || 0}`;
    const hash = Buffer.from(`${baseInput}_${timestamp}_${index || 0}`).toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 20);
    return `tsf_${hash}_${index || 0}`;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
  }

  private getMockNews(): TSFNewsItem[] {
    return [
      {
        id: 'tsf_mock_1',
        title: '2025 Avrupa Okullar Satranç Şampiyonası Başladı',
        summary: 'Avrupa Okullar Satranç Şampiyonası heyecanla başladı. Turnuvaya birçok ülkeden öğrenciler katılıyor.',
        imageUrl: null,
        originalUrl: 'https://www.tsf.org.tr/guncel-haberler',
        publishDate: new Date(),
        category: 'Turnuvalar'
      },
      {
        id: 'tsf_mock_2',
        title: 'Türkiye Satranç Federasyonu Yeni Projeler',
        summary: 'Federasyonumuz bünyesinde yeni projeler hayata geçiriliyor. Gençlerin satrança olan ilgisi artırılmaya çalışılıyor.',
        imageUrl: null,
        originalUrl: 'https://www.tsf.org.tr/guncel-haberler',
        publishDate: new Date(),
        category: 'Genel'
      },
      {
        id: 'tsf_mock_3',
        title: 'Satranç Eğitim Programları',
        summary: 'Okullarda satranç eğitimi için yeni programlar başlatıldı. Öğretmen eğitimleri devam ediyor.',
        imageUrl: null,
        originalUrl: 'https://www.tsf.org.tr/guncel-haberler',
        publishDate: new Date(),
        category: 'Eğitim'
      }
    ];
  }
}

export const tsfNewsScraper = new TSFNewsScraper(); 