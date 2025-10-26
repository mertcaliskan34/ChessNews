import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fetchLatestEloFileLinkAndType, { EloFileInfo } from './elo/tsfScraper';
import parsePDF, { EloEntry } from './elo/pdfParser';
import parseXLS from './elo/xlsParser'; 
import newsRoutes from './routes/news';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/news', newsRoutes);

// Firebase is used for database - no MySQL initialization needed

app.get('/', (req, res) => {
  res.send('Satranç Platformuna Hoş Geldiniz!');
});

let eloData: EloEntry[] = [];

app.get('/api/elo', (req, res) => {
  res.json(eloData);
});

app.post('/api/elo/update', async (_, res) => {
  try {
    const result = await updateEloData();
    if (result) {
      res.json({ message: 'ELO verisi manuel olarak güncellendi.', count: eloData.length });
    } else {
      res.status(500).json({ error: 'ELO verisi güncellenemedi. Detaylar için sunucu loglarına bakın.' });
    }
  } catch (error: any) {
    console.error("Error during manual ELO update:", error);
    res.status(500).json({ error: 'ELO verisi güncellenemedi.', details: error.message });
  }
});

async function updateEloData(): Promise<boolean> {
  console.log('🔄 ELO verisi çekme işlemi başlatılıyor...');
  const fileInfo: EloFileInfo = await fetchLatestEloFileLinkAndType();

  if (!fileInfo.link) {
    console.error('❌ En güncel ELO dosya linki bulunamadı.');
    return false;
  }

  let determinedFileType = fileInfo.type;

  // Eğer scraper 'unknown' döndürdüyse, linkten tahmin etmeye çalış
  // PhocaDownload linkleri genellikle .html ile biter ve doğrudan dosya uzantısı vermez.
  // Bu durumda HEAD isteği ile Content-Disposition veya Content-Type başlıklarına bakmak en sağlıklısıdır.
  if (determinedFileType === 'unknown' && fileInfo.link) {
    console.log(`[updateEloData] File type is 'unknown'. Attempting to determine from link or HEAD request: ${fileInfo.link}`);
    if (fileInfo.link.toLowerCase().endsWith('.xls') || fileInfo.link.toLowerCase().endsWith('.xlsx')) {
        determinedFileType = 'xls';
    } else if (fileInfo.link.toLowerCase().endsWith('.pdf')) {
        determinedFileType = 'pdf';
    } else {
        // PhocaDownload linkleri için HEAD isteği
        try {
            console.log(`[updateEloData] Making HEAD request to: ${fileInfo.link}`);
            const headResponse = await axios.head(fileInfo.link, { timeout: 10000 }); // 10 saniye timeout
            const contentType = headResponse.headers['content-type']?.toLowerCase();
            const contentDisposition = headResponse.headers['content-disposition']?.toLowerCase();
            
            console.log(`[updateEloData] HEAD Response - Content-Type: ${contentType}, Content-Disposition: ${contentDisposition}`);

            if (contentDisposition?.includes('.xls') || contentDisposition?.includes('.xlsx') || contentType?.includes('application/vnd.ms-excel') || contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
                determinedFileType = 'xls';
            } else if (contentDisposition?.includes('.pdf') || contentType?.includes('application/pdf')) {
                determinedFileType = 'pdf';
            } else {
                console.warn(`[updateEloData] Could not determine file type from HEAD response for ${fileInfo.link}. Defaulting to XLS for TSF as a fallback.`);
                determinedFileType = 'xls'; // TSF genellikle XLS verdiği için fallback
            }
        } catch (headError: any) {
            console.error(`[updateEloData] Error making HEAD request to ${fileInfo.link}: ${headError.message}. Defaulting to XLS for TSF.`);
            determinedFileType = 'xls'; // Hata durumunda TSF için XLS varsayımı
        }
    }
    console.log(`[updateEloData] Determined file type as: ${determinedFileType}`);
  }
  
  if (determinedFileType === 'unknown') {
    console.error(`❌ Dosya türü hala 'unknown' olarak kaldı, işlem yapılamıyor: ${fileInfo.link}`);
    return false;
  }


  try {
    console.log(`📄 Dosya (${determinedFileType.toUpperCase()}) indiriliyor: ${fileInfo.link}`);
    const response = await axios.get(fileInfo.link, { responseType: 'arraybuffer' });
    console.log(`📄 Dosya indirildi. Boyut: ${response.data.byteLength} bytes. Ayrıştırma başlıyor...`);
    
    let parsedEloList: EloEntry[] = [];

    if (determinedFileType === 'pdf') {
      parsedEloList = await parsePDF(response.data);
    } else if (determinedFileType === 'xls') {
    
      parsedEloList = await parseXLS(response.data);
    } else {
  
      console.error(`❌ Desteklenmeyen veya belirlenemeyen dosya türü: ${determinedFileType}`);
      return false;
    }
    
    if (parsedEloList.length > 0) {
      eloData = parsedEloList;
      console.log(`✅ ELO verisi güncellendi (${determinedFileType.toUpperCase()}). Toplam kayıt: ${eloData.length}`);
      // console.log("İlk 5 ELO kaydı:", eloData.slice(0, 5));
      return true;
    } else {
      console.warn(`⚠️ ${determinedFileType.toUpperCase()} ayrıştırıldı ancak ELO verisi bulunamadı. Dosya içeriği, başlık eşleştirmeleri (XLS için HEADER_MAPPINGS) veya ayrıştırıcı (PDF/XLS) kontrol edilmeli.`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ELO verisi güncellenirken hata oluştu (Dosya: ${fileInfo.link}, Tür: ${determinedFileType}):`, error);
    return false;
  }
}

// Sunucu başladığında ELO verilerini çek ve periyodik güncelleme ayarla
app.listen(PORT, async () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
  // Database: Using Firebase (no MySQL initialization needed)


  console.log('🚀 Sunucu başladı, ilk ELO veri güncellemesi tetikleniyor...');
  await updateEloData().then(success => {
    if(success) console.log('🚀 İlk ELO veri güncellemesi başarılı.');
    else console.warn('🚀 İlk ELO veri güncellemesi başarısız oldu. Logları kontrol edin.');
  });

  // Aylık cron (Her ayın 2'si, sabah 04:05'te)
  cron.schedule('5 4 2 * *', async () => {
    console.log('🕒 Otomatik ELO verisi çekiliyor (cron)...');
    await updateEloData();
  });
});