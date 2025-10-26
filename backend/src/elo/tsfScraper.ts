
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.tsf.org.tr';

interface LinkInfo {
  text: string;
  href: string;
  comparableValue: number;
}


interface BestMatchInfo {
  href: string;
  text: string;
  priority: number;
}


async function findLatestLinkOnPage(
  pageUrl: string,
  linkTextPattern: RegExp,
  dateExtractionPattern: RegExp,
  type: 'year' | 'month',
  linkSelector: string = 'a[href*="viewcategory"]'
): Promise<string | null> {
  try {
    const { data } = await axios.get(pageUrl, { timeout: 15000 });
    const $ = cheerio.load(data);
    const candidates: LinkInfo[] = [];
    $(linkSelector).each((_, el) => {
      const link = $(el);
      const text = link.text().trim();
      const href = link.attr('href');
      if (href && linkTextPattern.test(text)) {
        let currentValue = 0;
        const dateMatch = text.match(dateExtractionPattern);
        if (dateMatch) {
          if (type === 'year' && dateMatch[1]) {
            currentValue = parseInt(dateMatch[1], 10);
          } else if (type === 'month' && dateMatch[1] && dateMatch[2]) {
            currentValue = parseInt(dateMatch[1] + dateMatch[2], 10);
          } else if (type === 'month' && dateMatch[1] && dateMatch[1].length === 6 && /^\d{6}$/.test(dateMatch[1])) {
            currentValue = parseInt(dateMatch[1], 10);
          }
        }
        if (currentValue > 0) {
          candidates.push({ text, href, comparableValue: currentValue });
        }
      }
    });
    if (candidates.length === 0) {
      console.log(`[findLatestLinkOnPage] No candidates found on ${pageUrl} for type "${type}" with pattern ${linkTextPattern}`);
      return null;
    }
    let bestCandidate: LinkInfo = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      if (candidates[i].comparableValue > bestCandidate.comparableValue) {
        bestCandidate = candidates[i];
      }
    }
    return bestCandidate.href.startsWith('http') ? bestCandidate.href : BASE_URL + bestCandidate.href;
  } catch (error) {
    console.error(`[findLatestLinkOnPage] Error fetching or parsing ${pageUrl}:`, error);
    return null;
  }
}

export interface EloFileInfo {
  link: string | null;
  type: 'pdf' | 'xls' | 'unknown';
}

async function fetchLatestEloFileLinkAndType(): Promise<EloFileInfo> {
  try {
    const mainEloCategoryPageUrl = `${BASE_URL}/elo-listeleri/viewcategory/53-elo-listeleri`;
    console.log(`[fetchLatestEloFileLinkAndType] Starting with main ELO category page: ${mainEloCategoryPageUrl}`);

    const latestYearPageLink = await findLatestLinkOnPage(
      mainEloCategoryPageUrl, /Yılı Elo Listeleri|Elo Listeleri \d{4}|\d{4} Arşivi/i, /(\d{4})/, 'year'
    );
    if (!latestYearPageLink) {
      console.error('[fetchLatestEloFileLinkAndType] Could not find the latest YEAR category link.');
      return { link: null, type: 'unknown' };
    }
    console.log(`[fetchLatestEloFileLinkAndType] Found latest year page link: ${latestYearPageLink}`);

    const latestMonthPageLink = await findLatestLinkOnPage(
      latestYearPageLink,
      /\d{4}-\d{2}-|\b(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\b\s+\d{4}|\d{4}\s+\b(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\b/i,
      /(\d{4})-(0[1-9]|1[0-2])/, 'month'
    );
    if (!latestMonthPageLink) {
      console.error('[fetchLatestEloFileLinkAndType] Could not find the latest MONTH category link.');
      return { link: null, type: 'unknown' };
    }
    console.log(`[fetchLatestEloFileLinkAndType] Found latest month page link: ${latestMonthPageLink}`);

    console.log(`[fetchLatestEloFileLinkAndType] Fetching month page for ELO file links: ${latestMonthPageLink}`);
    const { data: monthPageData } = await axios.get(latestMonthPageLink, { timeout: 15000 });
    const $ = cheerio.load(monthPageData);
    
    let finalFileLink: string | null = null;
    let fileType: 'pdf' | 'xls' | 'unknown' = 'unknown'; 

    const primaryFilePattern = /Elo\s+Listesi/i;
    const excludePattern = /Pasif|En\s+İyiler|Geçici|FIDE\s+Rating\s+Listeleri/i;

    const downloadLinks = $('a.jd_download_url[title="İndir"]');
    console.log(`[fetchLatestEloFileLinkAndType] Found ${downloadLinks.length} potential jDownload links.`);

    let bestMatch: BestMatchInfo | null = null; 

    downloadLinks.each((_, el) => {
        const linkElement = $(el);
        const hrefAttr = linkElement.attr('href'); 

        if (!hrefAttr) return; 

        const fileEntryContainer = linkElement.closest('div.jd_details_row, tr');
        let fileDescriptionText = '';
        if (fileEntryContainer.length > 0) {
            fileDescriptionText = fileEntryContainer.find('.jd_file_title, .jd_filename, .cat_filename, .jdownloads_title').text().trim();
            if (!fileDescriptionText) {
                 const tempContainer = fileEntryContainer.clone();
                 tempContainer.find('a.jd_download_url').remove();
                 fileDescriptionText = tempContainer.text().trim().replace(/\s+/g, ' ');
            }
        } else {
            const parentTd = linkElement.closest('td');
            if (parentTd.length > 0) {
                const prevTd = parentTd.prev('td');
                if (prevTd.length > 0) {
                    fileDescriptionText = prevTd.text().trim();
                } else {
                    fileDescriptionText = parentTd.closest('tr').text().trim().replace(/\s+/g, ' ');
                }
            }
        }
        
        const actualTextToMatch = fileDescriptionText || $(el).parent().text() || $(el).closest('tr').text() || $(el).closest('div').text() || "";
        const cleanedText = actualTextToMatch.replace(/\s+/g, ' ').trim();

        if (primaryFilePattern.test(cleanedText) && !excludePattern.test(cleanedText)) {
            let priority = 2;
            if (cleanedText.toUpperCase().includes('[XLS]')) {
                priority = 1;
            } else if (cleanedText.toUpperCase().includes('[PDF]')) {
                priority = 2;
            }
            
            const currentItem: BestMatchInfo = { // Create the object with the defined type
                href: hrefAttr.startsWith('http') ? hrefAttr : BASE_URL + hrefAttr,
                text: cleanedText,
                priority: priority
            };
            
            if (!bestMatch || currentItem.priority < bestMatch.priority) {
                bestMatch = currentItem; 
            }
        }
    });

    if (!bestMatch) {
        console.log("[fetchLatestEloFileLinkAndType] Primary strategy (link -> text) didn't find a clear match. Trying text -> link strategy.");
        $('td, div.jd_file_layout, div.jd_details_row').each((_, elem) => { 
            const element = $(elem);
            const elementText = element.clone().children('div.jd_options, a.jd_download_url').remove().end().text().trim().replace(/\s+/g, ' '); 

            if (primaryFilePattern.test(elementText) && !excludePattern.test(elementText)) {
                let associatedLinkElement = element.find('a.jd_download_url[title="İndir"]');
                
                const hrefAttr = associatedLinkElement.attr('href');
                if (hrefAttr) {
                    let priority = 2;
                     if (elementText.toUpperCase().includes('[XLS]')) {
                        priority = 1;
                    } else if (elementText.toUpperCase().includes('[PDF]')) {
                        priority = 2;
                    }
                    console.log(`[fetchLatestEloFileLinkAndType] Alt strategy: Potential file: "${elementText}", Href: ${hrefAttr}, Priority: ${priority}`);
                    
                    const currentItemAlt: BestMatchInfo = { 
                        href: hrefAttr.startsWith('http') ? hrefAttr : BASE_URL + hrefAttr,
                        text: elementText,
                        priority: priority
                    };

                    if (!bestMatch || currentItemAlt.priority < bestMatch.priority) {
                        bestMatch = currentItemAlt; 
                    }
                    if (bestMatch && bestMatch.priority === 1) return false; 
                }
            }
        });
    }

    if (bestMatch !== null) { 
      const currentBestMatch: BestMatchInfo = bestMatch; 
      finalFileLink = currentBestMatch.href;
      console.log(`[fetchLatestEloFileLinkAndType] Successfully selected ELO file: "${currentBestMatch.text}", Link: ${finalFileLink}`);
    } else {
      console.error('[fetchLatestEloFileLinkAndType] Could not find a suitable ELO file download link on page:', latestMonthPageLink);
    }
    return { link: finalFileLink, type: fileType };

  } catch (error) {
    console.error('[fetchLatestEloFileLinkAndType] General error:', error);
    return { link: null, type: 'unknown' };
  }
}
export default fetchLatestEloFileLinkAndType;