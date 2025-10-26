const ExcelJS = require('exceljs');
import { EloEntry } from './pdfParser'; 

// Type definitions for ExcelJS objects
interface ExcelJSCell {
    value: any;
}

interface ExcelJSRow {
    eachCell(callback: (cell: ExcelJSCell, colNumber: number) => void): void;
}

interface ExcelJSWorksheet {
    eachRow(callback: (row: ExcelJSRow, rowNumber: number) => void): void;
}

interface ExcelJSWorkbook {
    xlsx: {
        load(buffer: Buffer): Promise<void>;
    };
    getWorksheet(index: number): ExcelJSWorksheet | undefined;
}

const HEADER_MAPPINGS: { [key: string]: keyof EloEntry | string } = {
    'ID': 'id',
    'FIDE ID': 'id',
    'LİSANS NO': 'id', 
    'UNVAN': 'title',
    'TITLE': 'title',
    'AD SOYAD': 'name', // "SOYİSİM, İsim" veya "SOYİSİM İsim" formatında bekleniyor
    'SOYADI, ADI': 'name',
    'SOYADI ADI': 'name',
    'NAME': 'name',
    'ELO': 'rating',
    'RATING': 'rating',
    'OYUN': 'games',
    'GAMES': 'games',
    'Oyun S.': 'games',
    'DOĞUM YILI': 'birthYear',
    'D.YILI': 'birthYear',
    'D YILI': 'birthYear',
    'BIRTH YEAR': 'birthYear',
    'YIL': 'birthYear',
};

function normalizeHeader(header: string): string {
    return String(header || '').toUpperCase().trim().replace(/İ/g, 'I'); // İ'leri I'ya çevir
}

function mapRowToEloEntry(row: any[], headerIndexes: { [key in keyof EloEntry]?: number }): EloEntry | null {
    try {
        const id = String(row[headerIndexes.id!] || '').trim();
        if (!id || !/^\d{6,8}$/.test(id)) {
            return null;
        }
        const nameStr = String(row[headerIndexes.name!] || '').trim();

        const ratingStr = String(row[headerIndexes.rating!] || '0').trim();
        const gamesStr = String(row[headerIndexes.games!] || '0').trim();
        const birthYearStr = String(row[headerIndexes.birthYear!] || '0').trim();

        const entry: EloEntry = {
            id: id,
            title: String(row[headerIndexes.title!] || '').trim() || null,
            name: nameStr,
            rating: parseInt(ratingStr, 10) || 0,
            games: parseInt(gamesStr, 10) || 0,
            birthYear: parseInt(birthYearStr, 10) || 0,
        };

        if (!entry.name || entry.rating === 0 || entry.birthYear === 0) {
            return null;
        }
        return entry;

    } catch (e) {
        console.error("Error mapping row to EloEntry:", row, e);
        return null;
    }
}

async function parseXLS(buffer: Buffer): Promise<EloEntry[]> {
    const eloList: EloEntry[] = [];
    let jsonData: any[][] = []; // ExcelJS'ten okunan ham veriyi tutmak için
    const headerIndexes: { [key in keyof EloEntry]?: number } = {};

    try {
        const workbook: ExcelJSWorkbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        // İlk worksheet'i al
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            console.warn("XLS is empty or has no worksheets.");
            return [];
        }

        // Tüm satırları array olarak al
        worksheet.eachRow((row: ExcelJSRow, rowNumber: number) => {
            const rowValues: any[] = [];
            row.eachCell((cell: ExcelJSCell, colNumber: number) => {
                rowValues[colNumber - 1] = cell.value;
            });
            jsonData.push(rowValues);
        });

        if (jsonData.length < 2) {
            console.warn("XLS is empty or has no data rows after header.");
            return [];
        }

        const headersRaw: string[] = jsonData[0].map(h => String(h || '').trim());
        const normalizedHeaders: string[] = headersRaw.map(normalizeHeader);
        const dataRows = jsonData.slice(1);

        for (const targetKey in HEADER_MAPPINGS) {
            const normalizedTargetKey = normalizeHeader(targetKey);
            const columnIndex = normalizedHeaders.indexOf(normalizedTargetKey);
            if (columnIndex !== -1) {
                const eloEntryKey = HEADER_MAPPINGS[targetKey] as keyof EloEntry;
                if (!headerIndexes[eloEntryKey]) { 
                    headerIndexes[eloEntryKey] = columnIndex;
                }
            }
        }
        
        const requiredEloKeys: (keyof EloEntry)[] = ['id', 'name', 'rating',  'birthYear'];
        let missingCriticalHeader = false;
        for (const reqKey of requiredEloKeys) {
            if (headerIndexes[reqKey] === undefined) {
                console.error(`XLS Parse Error: Required header for '${reqKey}' (mapped from HEADER_MAPPINGS) not found in XLS. Normalized XLS Headers: [${normalizedHeaders.join(', ')}]`);
                missingCriticalHeader = true;
            }
        }

        if (missingCriticalHeader) {
            console.error("Cannot parse XLS due to missing critical headers. Check XLS file structure and HEADER_MAPPINGS.");
            console.log("Original XLS Headers found:", headersRaw.join(' | '));
            console.log("Mapped Header Indexes:", headerIndexes);
            return [];
        }

        for (const row of dataRows) {
            if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) continue; // Tamamen boş satırları atla
            const entry = mapRowToEloEntry(row, headerIndexes);
            if (entry) {
                eloList.push(entry);
            }
        }

    } catch (error) {
        console.error("Error parsing XLS file:", error);
        if (jsonData.length > 0) {
            console.log("XLS Headers that might have caused error:", jsonData[0]);
            console.log("First few data rows:");
            jsonData.slice(1, 6).forEach(r => console.log(r));
        }
        return [];
    }

    if (eloList.length === 0 && jsonData && jsonData.length > 1) {
        console.warn("XLS parsed but no ELO entries extracted. This might be due to all rows failing validation or incorrect header mapping.");
        console.log("XLS Headers found:", jsonData[0].map(normalizeHeader).join(' | '));
        console.log("Mapped Header Indexes:", headerIndexes);
        console.log("First 5 data rows for debugging:");
        jsonData.slice(1, 6).forEach(r => console.log(r));
    }
    return eloList;
}

export default parseXLS;