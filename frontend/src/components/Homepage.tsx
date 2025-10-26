import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FeaturedNewsCarousel from './FeaturedNewsCarousel';
import FeaturedNewsSection from './FeaturedNewsSection';
import HeroSection from './HeroSection';
import { newsAPI } from '../config/api';
import { getAllNews } from '../firebase/news';

interface FeaturedNewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string | null;
  originalUrl?: string;
  publishDate: string;
  category: string;
  importance: number;
  tags?: string[];
  source: string;
}

interface ErrorState {
  message: string;
  type: 'warning' | 'error' | 'info';
  details?: string;
}

interface ApiError extends Error {
  userMessage?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  code?: string;
}

const HomepageContainer = styled(Container)(() => ({
  minHeight: '100vh',
  paddingTop: '4rem',
  paddingBottom: '4rem',
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
  color: '#fff',
}));

const MainContent = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

const CarouselSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(8),
  padding: theme.spacing(4),
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  color: '#D4AF37',
  fontFamily: 'Playfair Display, serif',
  fontWeight: 700,
  textShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
}));

const LoadingContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '300px',
  textAlign: 'center',
}));

const Homepage: React.FC = () => {
  const [featuredNews, setFeaturedNews] = useState<FeaturedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchFeaturedNews = useCallback(async (refresh = false) => {
    try {
      setLoading(!refresh);
      setError(null);

      // Fetch Chess.com featured news from backend
      const chessComResponse = await newsAPI.getFeaturedNews('5');
      
      // Fetch admin news from Firebase
      let adminNews: FeaturedNewsItem[] = [];
      try {
        console.log('🔥 Homepage: Fetching admin news from Firebase...');
        const firebaseNews = await getAllNews(5); // Get latest 5 admin news
        console.log('🔥 Homepage: Received admin news:', firebaseNews.length, 'items');
        console.log('🔥 Homepage: Admin news data:', firebaseNews);
        
        adminNews = firebaseNews.map((article, index) => ({
          id: article.id || 'admin_featured_' + Date.now() + '_' + index,
          title: article.header,
          summary: article.text.substring(0, 200) + (article.text.length > 200 ? '...' : ''),
          imageUrl: article.imageUrl || null,
          originalUrl: undefined, // Admin news don't have external URLs
          publishDate: (() => {
            try {
              if (article.createdAt && 'toDate' in article.createdAt && typeof article.createdAt.toDate === 'function') {
                return article.createdAt.toDate().toISOString();
              } else if (article.createdAt && typeof article.createdAt.toISOString === 'function') {
                return article.createdAt.toISOString();
              } else if (article.createdAt) {
                return new Date(article.createdAt).toISOString();
              } else {
                return new Date().toISOString();
              }
            } catch {
              return new Date().toISOString();
            }
          })(),
          category: 'ChessNews', // Always use ChessNews as category for admin news
          importance: article.badge === 'ÖNEMLİ' ? 5 : 4, // Admin news get high importance
          tags: ['ChessNews', article.badge || ''].filter(Boolean), // Always include ChessNews tag
          source: 'chessnews' // Use 'chessnews' as source for admin news
        }));
        
        console.log('🔥 Homepage: Mapped admin news for homepage:', adminNews);
      } catch (firebaseError) {
        console.error('❌ Could not fetch admin news from Firebase for homepage:', firebaseError);
        // Continue without admin news if Firebase fails
      }

      if (chessComResponse.success) {
        // Map Chess.com news to our format
        const chessComNews: FeaturedNewsItem[] = chessComResponse.data.map((item: FeaturedNewsItem) => ({
          ...item,
          source: 'chesscom'
        }));

        // Combine admin news with Chess.com news
        const combinedNews = [...adminNews, ...chessComNews];
        console.log('🔥 Homepage: Combined news before sorting:', combinedNews);
        
        // Sort by importance first (admin news get priority), then by date
        combinedNews.sort((a, b) => {
          // Admin news (chessnews) get highest priority
          if (a.source === 'chessnews' && b.source !== 'chessnews') return -1;
          if (a.source !== 'chessnews' && b.source === 'chessnews') return 1;
          
          // Then sort by importance
          if (a.importance !== b.importance) {
            return b.importance - a.importance;
          }
          
          // Finally sort by date
          const dateA = new Date(a.publishDate).getTime();
          const dateB = new Date(b.publishDate).getTime();
          return dateB - dateA;
        });
        
        console.log('🔥 Homepage: Combined news after sorting:', combinedNews);
        
        // Take top 8 items for featured display (increased to show more admin news)
        const finalNews = combinedNews.slice(0, 8);
        console.log('🔥 Homepage: Final news to display:', finalNews);
        setFeaturedNews(finalNews);
        setLastUpdated(chessComResponse.lastUpdated);
        
        if (refresh) {
          showNotification(`Öne çıkan haberler yenilendi! ${adminNews.length} ChessNews + ${chessComNews.length} Chess.com haberi 🎉`, 'success');
        }
      } else {
        // If Chess.com fails but we have admin news, show only admin news
        if (adminNews.length > 0) {
          setFeaturedNews(adminNews);
          setLastUpdated(new Date().toISOString());
          if (refresh) {
            showNotification(`ChessNews haberleri yüklendi (${adminNews.length} haber) ⚠️`, 'warning');
          }
        } else {
          throw new Error(chessComResponse.message || 'API responded with success: false');
        }
      }
    } catch (err) {
      console.error('Error fetching featured news:', err);
      
      const error = err as ApiError;
      const errorMessage = error.userMessage || error.message || 'Öne çıkan haberleri yüklerken bir hata oluştu';
      const errorType: ErrorState['type'] = error.response?.status === 404 ? 'warning' : 'error';
      
      setError({
        message: errorMessage,
        type: errorType,
        details: error.response?.status ? `HTTP ${error.response.status}` : error.code
      });
      
      // Use chess.com themed mock data as fallback
      setFeaturedNews([
        {
          id: 'loading_1',
          title: 'En Güncel Satranç Haberlerini Yüklüyoruz',
          summary: 'ChessNews editörleri ve Chess.com kaynaklarından en son haberleri getiriyoruz. Lütfen bekleyin.',
          imageUrl: 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=600&h=400&fit=crop',
          originalUrl: 'https://www.chess.com/news',
          publishDate: new Date().toISOString(),
          category: 'Sistem',
          importance: 3,
          tags: ['yükleniyor'],
          source: 'local'
        }
      ]);
      
      if (refresh) {
        showNotification('Haberler yenilenirken hata oluştu. Mock veriler gösteriliyor.', 'warning');
      }
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const refreshFeaturedNews = async () => {
    try {
      // Refresh both Chess.com and admin news
      await newsAPI.refreshChessComNews();
      await fetchFeaturedNews(true);
    } catch (err) {
      console.error('Error refreshing featured news:', err);
      const error = err as ApiError;
      const errorMessage = error.userMessage || 'Haberler yenilenirken hata oluştu';
      showNotification(errorMessage, 'error');
    }
  };

  useEffect(() => {
    fetchFeaturedNews();
  }, [fetchFeaturedNews]);

  // Split news items according to updated requirements:
  // Carousel: Latest 3 news (admin + Chess.com mixed)
  // Featured Section: Most recent 4 news (admin + Chess.com mixed) - increased to show more admin news
  const carouselItems = featuredNews.slice(0, 3); // Top 3 latest news for carousel
  const featuredSectionItems = featuredNews.slice(0, 4); // Top 4 recent news for featured section
  
  console.log('🔥 Homepage: Rendering carousel items:', carouselItems.length);
  console.log('🔥 Homepage: Rendering featured section items:', featuredSectionItems.length);

  return (
    <HomepageContainer>
      <HeroSection />
      
      <MainContent maxWidth="lg">
        {error && (
          <Alert 
            severity={error.type}
            sx={{ 
              mb: 3, 
              borderRadius: '12px',
              '& .MuiAlert-message': {
                fontSize: '1rem'
              }
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => fetchFeaturedNews(true)}
                disabled={loading}
              >
                Tekrar Dene
              </Button>
            }
          >
            <Typography variant="body1" gutterBottom>
              {error.message}
            </Typography>
            {error.details && (
              <Typography variant="caption" color="text.secondary">
                Detay: {error.details}
              </Typography>
            )}
            {error.type === 'warning' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                💡 Backend sunucusunun çalıştığından emin olun: <code>cd ChessNews/backend && npm run dev</code>
              </Typography>
            )}
          </Alert>
        )}

        {/* Featured News Carousel Section - Latest 3 Mixed News */}
        <CarouselSection>
          <SectionTitle variant="h2">
            Son Dakika Satranç Haberleri
          </SectionTitle>
          
          {loading ? (
            <LoadingContainer>
              <CircularProgress size={60} sx={{ color: '#D4AF37', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                ChessNews ve Chess.com\'dan son haberler yükleniyor...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En güncel 3 satranç haberi getiriliyor...
              </Typography>
            </LoadingContainer>
          ) : (
            <FeaturedNewsCarousel 
              newsItems={carouselItems}
              loading={loading}
              autoPlay={true}
              interval={6000}
              showItemCount={3}
            />
          )}

          {lastUpdated && !loading && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Son güncelleme: {new Date(lastUpdated).toLocaleString('tr-TR')} • ChessNews + Chess.com
              </Typography>
              <Button
                size="small"
                onClick={refreshFeaturedNews}
                sx={{ 
                  ml: 2,
                  color: '#D4AF37',
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)'
                  }
                }}
              >
                Yenile
              </Button>
            </Box>
          )}
        </CarouselSection>

        {/* Featured News Section - Recent 2 Mixed News */}
        <FeaturedNewsSection 
          newsItems={featuredSectionItems}
          loading={loading}
          title="Öne Çıkan Haberler"
          subtitle="ChessNews editörleri ve Chess.com'dan en önemli 4 haber"
        />

        {/* Source Information */}
        <Box 
          sx={{ 
            textAlign: 'center',
            mt: 4,
            p: 3,
            background: 'rgba(76, 175, 80, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}
        >
          <Typography variant="h6" sx={{ color: '#4CAF50', mb: 2 }}>
            📰 Haber Kaynakları
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ✅ <strong>ChessNews Editörü:</strong> Özenle hazırlanmış özel içerikler
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ♟️ <strong>Chess.com:</strong> Uluslararası satranç haberleri ve analizler
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🏆 <strong>TSF:</strong> Türkiye Satranç Federasyonu resmi duyuruları
          </Typography>
        </Box>

        {/* Snackbar for notifications */}
        {snackbar.open && (
          <Alert 
            severity={snackbar.severity}
            sx={{ 
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        )}
      </MainContent>
    </HomepageContainer>
  );
};

export default Homepage; 