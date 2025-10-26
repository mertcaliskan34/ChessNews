// DÜZELTME 1: İçe aktarma (import) yöntemini değiştiriyoruz.
import { load, CheerioAPI, Cheerio } from 'cheerio';
import axios from 'axios';
import { Element } from 'domhandler';
export interface ChessComNewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  originalUrl: string;
  publishDate: Date;
  category: string;
  importance: number; // 1-5 scale for sorting by importance
  tags: string[];
}

export class ChessComNewsScraper {
  private readonly BASE_URL = 'https://www.chess.com';
  private readonly NEWS_URL = 'https://www.chess.com/tr/news';

  async scrapeNews(): Promise<ChessComNewsItem[]> {
    try {
      console.log('Starting Chess.com news scraping...');
      
      const response = await axios.get(this.NEWS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        timeout: 15000,
      });

      // DÜZELTME 2: `cheerio.load` yerine doğrudan `load` kullanıyoruz.
      const $ = load(response.data);
      const newsItems: ChessComNewsItem[] = [];

      const newsSelectors = [
        '.news-item', '.article-preview', '.post-preview', '.news-card',
        '.content-card', '[data-cy="news-item"]', '.master-class-preview', 'article'
      ];

      let foundNews = false;

      for (const selector of newsSelectors) {
        const items = $(selector);
        if (items.length > 0) {
          console.log(`Found ${items.length} items with selector: ${selector}`);
          
          items.each((index, element) => {
            if (element.type !== 'tag') return;
            if (newsItems.length >= 15) return;
            
            const $item = $(element);
            // Artık $ parametresini geçmek sorunsuz çalışacaktır.
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

      if (!foundNews) {
        console.log('Trying to extract from general links...');
        $('a[href*="/news/"], a[href*="/article/"]').each((index, element) => {
          if (newsItems.length >= 15) return;
          
          const $link = $(element);
          const href = $link.attr('href');
          
          if (href && (href.includes('/news/') || href.includes('/article/'))) {
            const title = this.extractTitle($, $link);
            
            if (title && title.length > 10) {
              const newsItem: ChessComNewsItem = {
                id: this.generateId(href, index),
                title: this.cleanText(title),
                summary: this.extractSummary($, $link),
                imageUrl: this.extractImage($, $link),
                originalUrl: this.resolveUrl(href),
                publishDate: this.extractDate($, $link),
                category: this.determineCategory(title),
                importance: this.calculateImportance($, $link, index),
                tags: this.extractTags($, $link, title)
              };
              
              newsItems.push(newsItem);
            }
          }
        });
      }

      newsItems.sort((a, b) => {
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      });

      console.log(`Successfully scraped ${newsItems.length} news items from Chess.com`);
      return newsItems;
      
    } catch (error) {
      console.error('Error scraping Chess.com news:', error);
      return this.getMockNews();
    }
  }

  // DÜZELTME 3: Tüm tip referanslarını güncelliyoruz.
  private extractNewsItem($: CheerioAPI, $item: Cheerio<Element>, index: number): ChessComNewsItem | null {
    try {
      const title = this.extractTitle($, $item);
      if (!title || title.length < 10) return null;

      const link = this.extractLink($, $item);
      const imageUrl = this.extractImage($, $item);
      const summary = this.extractSummary($, $item);
      const publishDate = this.extractDate($, $item);
      const category = this.determineCategory(title);
      const importance = this.calculateImportance($, $item, index);
      const tags = this.extractTags($, $item, title);

      return {
        id: this.generateId(link || title, index),
        title: this.cleanText(title),
        summary: summary,
        imageUrl: imageUrl,
        originalUrl: this.resolveUrl(link || ''),
        publishDate: publishDate,
        category: category,
        importance: importance,
        tags: tags
      };
    } catch (error) {
      console.error('Error extracting news item:', error);
      return null;
    }
  }

  private extractTitle($: CheerioAPI, $item: Cheerio<Element>): string {
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4', '.title', '.headline', '.news-title', 
      '.article-title', '.post-title', '[data-cy="title"]', '[data-cy="headline"]', 'a[title]'
    ];
    for (const selector of titleSelectors) {
      const titleElement = $item.find(selector).first();
      if (titleElement.length > 0) {
        const title = titleElement.text().trim() || titleElement.attr('title') || '';
        if (title.length > 5) return title;
      }
    }
    const itemText = $item.text().trim();
    const linkTitle = $item.attr('title') || $item.find('a').attr('title') || '';
    if (linkTitle.length > 5) return linkTitle;
    if (itemText.length > 10) return itemText.substring(0, 100);
    return '';
  }
  
  private extractLink($: CheerioAPI, $item: Cheerio<Element>): string {
    return $item.attr('href') || $item.find('a').first().attr('href') || $item.find('[href]').first().attr('href') || '';
  }

  private extractImage($: CheerioAPI, $item: Cheerio<Element>): string | null {
    const imgSelectors = [
      'img', '.image img', '.thumbnail img', '.news-image img',
      '.article-image img', '.post-image img', '[data-cy="image"] img'
    ];
    for (const selector of imgSelectors) {
      const $img = $item.find(selector).first();
      if ($img.length > 0) {
        const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy') || $img.attr('data-original');
        if (src) return this.resolveUrl(src);
      }
    }
    const bgImage = $item.css('background-image');
    if (bgImage && bgImage.includes('url(')) {
      const match = bgImage.match(/url\(['"]?([^'"]*?)['"]?\)/);
      if (match && match[1]) return this.resolveUrl(match[1]);
    }
    return null;
  }

  private extractSummary($: CheerioAPI, $item: Cheerio<Element>): string {
    const summarySelectors = [
      '.summary', '.excerpt', '.description', '.preview',
      '.article-summary', '.post-excerpt', '.news-summary',
      '[data-cy="summary"]', '[data-cy="excerpt"]', 'p'
    ];
    for (const selector of summarySelectors) {
      const $summary = $item.find(selector).first();
      if ($summary.length > 0) {
        const text = $summary.text().trim();
        if (text.length > 20) {
          return this.cleanText(text.substring(0, 200)) + (text.length > 200 ? '...' : '');
        }
      }
    }
    return 'Chess.com\'dan güncel satranç haberi...';
  }

  private extractDate($: CheerioAPI, $item: Cheerio<Element>): Date {
    const dateSelectors = [
      '.date', '.publish-date', '.created-date', '.timestamp',
      '[data-cy="date"]', '[datetime]', 'time'
    ];
    for (const selector of dateSelectors) {
      const $date = $item.find(selector).first();
      if ($date.length > 0) {
        const dateText = $date.text().trim() || $date.attr('datetime') || '';
        if (dateText) {
          const parsedDate = new Date(dateText);
          if (!isNaN(parsedDate.getTime())) return parsedDate;
        }
      }
    }
    return new Date();
  }

  private determineCategory(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('world') || titleLower.includes('dünya')) return 'Dünya Şampiyonası';
    if (titleLower.includes('tournament') || titleLower.includes('turnuva')) return 'Turnuvalar';
    if (titleLower.includes('grandmaster') || titleLower.includes('gm')) return 'Grandmaster';
    if (titleLower.includes('analysis') || titleLower.includes('analiz')) return 'Analiz';
    if (titleLower.includes('lesson') || titleLower.includes('ders')) return 'Eğitim';
    if (titleLower.includes('puzzle') || titleLower.includes('problem')) return 'Problemler';
    return 'Genel';
  }

  private calculateImportance($: CheerioAPI, $item: Cheerio<Element>, index: number): number {
    let importance = 5 - Math.floor(index / 3);
    if ($item.hasClass('featured') || $item.hasClass('highlight')) importance += 2;
    if ($item.find('.badge, .label').length > 0) importance += 1;
    if ($item.find('img').length > 0) importance += 1;
    const title = this.extractTitle($, $item).toLowerCase();
    if (title.includes('world') || title.includes('championship')) importance += 2;
    if (title.includes('grandmaster') || title.includes('titled')) importance += 1;
    return Math.max(1, Math.min(5, importance));
  }

  private extractTags($: CheerioAPI, $item: Cheerio<Element>, title: string): string[] {
    const tags: string[] = [];
    $item.find('.tag, .category, .label').each((index, element) => {
      const tag = $(element).text().trim();
      if (tag) tags.push(tag);
    });
    const titleLower = title.toLowerCase();
    if (titleLower.includes('blitz')) tags.push('Blitz');
    if (titleLower.includes('rapid')) tags.push('Rapid');
    if (titleLower.includes('classical')) tags.push('Classical');
    if (titleLower.includes('online')) tags.push('Online');
    if (titleLower.includes('otb')) tags.push('Over the Board');
    return [...new Set(tags)];
  }

  // ... (resolveUrl ve diğer yardımcı metotlar aynı kalır)
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
    return `chess_${hash}_${index || 0}`;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\t/g, ' ')
      .trim();
  }

  private getMockNews(): ChessComNewsItem[] {
    return [
      {
        id: 'chess_scraper_notice',
        title: 'Chess.com Scraper Aktif - Gerçek Veriler Bekleniyor',
        summary: 'Chess.com kaynaklarından gerçek haberler çekilmeye çalışılıyor. Bu geçici bir durumdur.',
        imageUrl: 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=600&h=400&fit=crop',
        originalUrl: 'https://www.chess.com/news',
        publishDate: new Date(),
        category: 'Sistem',
        importance: 2,
        tags: ['chess.com', 'scraper']
      }
    ];
  }

}

export const chessComNewsScraper = new ChessComNewsScraper();