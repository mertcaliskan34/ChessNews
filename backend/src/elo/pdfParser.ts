import pdfParse from 'pdf-parse';

export type EloEntry = {
    id: string;
    title: string | null;
    name: string;
    rating: number;
    games: number;
    birthYear: number;
};

// Updated regex patterns for multi-line format
// Based on the actual format: "44507356Gurel, EdizGM2636"
// Pattern 1: ID + Name + Title + Rating (title is optional)
const ID_NAME_TITLE_RATING_REGEX = /^(\d{7,8})(.+?)([A-Z]{2,3})(\d{4})$/;
// Pattern 2: ID + Name + Rating (no title)
const ID_NAME_RATING_REGEX = /^(\d{7,8})(.+?)(\d{4})$/;
const KNOWN_TITLES = ["GM", "IM", "FM", "WGM", "WIM", "WFM", "CM", "WCM"];

async function parsePDFWithPdfParse(buffer: Buffer): Promise<EloEntry[]> {
    console.log('[pdf-parse] Starting PDF parsing...');
    const eloList: EloEntry[] = [];
    let extractedText = '';
    let processedCount = 0;
    let skippedCount = 0;

    try {
        // Parse PDF using pdf-parse (Node.js compatible)
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        
        console.log(`[pdf-parse] PDF parsed successfully. Page count: ${pdfData.numpages}`);
        console.log(`[pdf-parse] Total text length: ${extractedText.length} characters`);

        // Split into lines and clean up
        const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        console.log(`[pdf-parse] Extracted ${lines.length} non-empty lines`);
        console.log("--- [pdf-parse] First 20 lines ---");
        lines.slice(0, 20).forEach((line: string, idx: number) => console.log(`Line ${idx + 1}: "${line}"`));
        console.log("--- End sample lines ---");

        // Process lines in groups of 3 (main data line + games + birth year)
        for (let i = 0; i < lines.length - 2; i++) {
            const mainLine = lines[i].trim();
            const gamesLine = lines[i + 1].trim();
            const birthYearLine = lines[i + 2].trim();
            
            // Skip header lines and non-data lines
            if (mainLine.startsWith("Sıra") || 
                mainLine.startsWith("Sayfa") || 
                mainLine.startsWith("FIDE") ||
                mainLine.startsWith("Lisans") ||
                mainLine.includes("SoyisimUnvan") ||
                mainLine.includes("ID NoSoyisim") ||
                mainLine.length < 10 ||
                !/^\d{7,8}/.test(mainLine)) {
                skippedCount++;
                continue;
            }
            
            processedCount++;

            // Try to match the main data line (ID + Name + Title + Rating)
            let match = mainLine.match(ID_NAME_TITLE_RATING_REGEX);
            let hasTitle = true;
            
            if (!match) {
                // Try without explicit title
                match = mainLine.match(ID_NAME_RATING_REGEX);
                hasTitle = false;
            }
            
            // Debug logging for first few attempts
            if (eloList.length < 5) {
                console.log(`[pdf-parse] Trying to parse line: "${mainLine}"`);
                console.log(`[pdf-parse] Match result: ${match ? 'Success' : 'Failed'} (hasTitle: ${hasTitle})`);
                if (match) {
                    console.log(`[pdf-parse] Parsed: ID=${match[1]}, Name="${match[2]}", Title="${hasTitle ? match[3] : 'N/A'}", Rating=${match[hasTitle ? 4 : 3]}`);
                }
            }
            
            if (match) {
                try {
                    const id = match[1];
                    let name = match[2].trim();
                    let title: string | null = null;
                    let ratingIndex = hasTitle ? 4 : 3;
                    
                    // If we used the pattern with title, extract it
                    if (hasTitle && match[3]) {
                        title = match[3];
                    }
                    
                    const rating = parseInt(match[ratingIndex], 10);
                    
                    // Parse games from next line
                    const games = parseInt(gamesLine, 10);
                    if (isNaN(games)) {
                        // If games line doesn't parse, still try to continue with 0 games
                        console.log(`[pdf-parse] Warning: Games line not a number: "${gamesLine}", using 0`);
                    }
                    
                    // Parse birth year from third line
                    const birthYear = parseInt(birthYearLine, 10);
                    if (isNaN(birthYear)) {
                        console.log(`[pdf-parse] Warning: Birth year line not a number: "${birthYearLine}", skipping entry`);
                        continue;
                    }
                    
                    // Validate data ranges (be more lenient)
                    if (isNaN(rating) || rating < 800 || rating > 3500) {
                        console.log(`[pdf-parse] Warning: Invalid rating ${rating}, skipping entry`);
                        continue;
                    }
                    if (birthYear < 1900 || birthYear > new Date().getFullYear()) {
                        console.log(`[pdf-parse] Warning: Invalid birth year ${birthYear}, skipping entry`);
                        continue;
                    }
                    
                    // If no title was found in regex, check if it's embedded in the name
                    if (!title) {
                        for (const knownTitle of KNOWN_TITLES) {
                            if (name.includes(knownTitle)) {
                                title = knownTitle;
                                name = name.replace(knownTitle, '').trim();
                                break;
                            }
                        }
                    }
                    
                    // Clean up the name (remove extra spaces, commas at the end)
                    name = name.replace(/,\s*$/, '').replace(/\s+/g, ' ').trim();

                    const entry: EloEntry = {
                        id: id,
                        title: title,
                        name: name,
                        rating: rating,
                        games: isNaN(games) ? 0 : games,
                        birthYear: birthYear
                    };

                    eloList.push(entry);
                    
                    // Skip the next 2 lines since we've processed them
                    i += 2;
                    
                } catch (e) { 
                    console.error("[pdf-parse] Error parsing matched line components: ", mainLine, e); 
                }
            }
        }

    } catch (error: any) {
        console.error("[pdf-parse] Critical error during PDF processing:", error.message);
        if (error.stack) console.error(error.stack);
        return [];
    }

    console.log(`[pdf-parse] Processing summary:`);
    console.log(`  - Total lines extracted: ${extractedText.split('\n').filter(line => line.trim().length > 0).length}`);
    console.log(`  - Lines processed: ${processedCount || 0}`);
    console.log(`  - Lines skipped: ${skippedCount || 0}`);
    console.log(`  - ELO entries extracted: ${eloList.length}`);
    
    if (eloList.length === 0) { 
        console.warn("[pdf-parse] PDF parsed but no ELO entries found. Check line format and regex patterns."); 
        console.log("[pdf-parse] Sample lines for debugging:");
        const sampleLines = extractedText.split('\n').slice(0, 15);
        sampleLines.forEach((line: string, idx: number) => console.log(`  ${idx + 1}: "${line.trim()}"`));
    } else { 
        console.log(`[pdf-parse] Successfully parsed ${eloList.length} ELO entries.`); 
        console.log(`[pdf-parse] First 3 entries:`, eloList.slice(0, 3));
    }
    
    return eloList;
}

export default parsePDFWithPdfParse;