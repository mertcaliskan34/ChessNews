import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  InputBase,
  Paper,
  Fab,
  Snackbar,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { styled } from '@mui/material/styles';
import HeroSection from './HeroSection';
import NewsCard from './NewsCard';
import { newsAPI } from '../config/api';
import { getAllNews } from '../firebase/news';
import NewsDetailModal from './NewsDetailModal';

interface NewsItem {
  id: string | number;
  title: string;
  content?: string;
  summary?: string;
  publishDate?: string;
  created_at?: string;
  excerpt?: string;
  imageUrl?: string;
  image?: string;
  category?: string;
  categoryColor?: string;
  author?: string;
  authorAvatar?: string;
  readTime?: string;
  isBookmarked?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  source?: 'local' | 'tsf' | 'chesscom';
  originalUrl?: string;
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

const NewsContainer = styled(Box)({
  background: 'linear-gradient(135deg, #F5F5DC 0%, #FAFAFA 100%)',
  minHeight: '100vh',
});

const SearchSection = styled(Paper)({
  background: 'rgba(250, 250, 250, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  padding: '24px',
  margin: '40px 0',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  boxShadow: '0 8px 32px rgba(61, 39, 35, 0.1)',
});

const SearchInput = styled(InputBase)({
  flex: 1,
  padding: '12px 16px',
  fontSize: '1.1rem',
  color: '#3E2723',
  '& .MuiInputBase-input': {
    '&::placeholder': {
      color: 'rgba(141, 110, 99, 0.7)',
    }
  }
});

const FilterButton = styled(Button)({
  borderRadius: '12px',
  padding: '8px 16px',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  color: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(212, 175, 55, 0.1)',
    borderColor: '#D4AF37',
    color: 'white',
  },
  '&.active': {
    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
    color: '#3E2723',
    borderColor: 'transparent',
  }
});

const SectionTitle = styled(Typography)({
  fontFamily: 'Playfair Display, serif',
  fontWeight: 700,
  fontSize: '2.5rem',
  color: '#3E2723',
  marginBottom: '1rem',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
    borderRadius: '2px',
  }
});

const BackToTopFab = styled(Fab)({
  position: 'fixed',
  bottom: '32px',
  right: '32px',
  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
  color: '#3E2723',
  zIndex: 1000,
  '&:hover': {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
    transform: 'scale(1.1)',
  }
});

const mockNews: NewsItem[] = [
  {
    id: 'mock_1',
    title: 'Backend Sunucusuna Bağlanılamıyor',
    excerpt: 'Backend sunucusu ile bağlantı kurulamıyor. Lütfen sunucunun aktif olduğunu kontrol edin.',
    created_at: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=600&h=400&fit=crop',
    category: 'Sistem',
    categoryColor: '#FF9800',
    author: 'ChessNews Sistem',
    readTime: '1 dk',
    source: 'local'
  }
];

const NewsList: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string | number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show snackbar notifications
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch news from API with improved error handling
  const fetchNews = useCallback(async (refresh = false) => {
    try {
      setLoading(!refresh);
      if (refresh) setRefreshing(true);
      setError(null);

      // Fetch scraped news from backend (TSF + Chess.com)
      const scrapedResponse = await newsAPI.getNews('all', '20', refresh);
      
      // Fetch admin news from Firebase
      let adminNews: NewsItem[] = [];
      try {
        console.log('🔥 NewsList: Fetching admin news from Firebase...');
        const firebaseNews = await getAllNews();
        console.log('🔥 NewsList: Raw Firebase news:', firebaseNews);
        
        adminNews = firebaseNews.map((article, index) => {
          // Handle Firebase Timestamp conversion safely
          let publishDate: string;
          try {
            if (article.createdAt && 'toDate' in article.createdAt && typeof article.createdAt.toDate === 'function') {
              // Firebase Timestamp object - call toDate() then toISOString()
              publishDate = article.createdAt.toDate().toISOString();
            } else if (article.createdAt && typeof article.createdAt.toISOString === 'function') {
              // Regular Date object
              publishDate = article.createdAt.toISOString();
            } else if (article.createdAt) {
              // Try converting to Date first
              publishDate = new Date(article.createdAt).toISOString();
            } else {
              // Fallback to current date
              publishDate = new Date().toISOString();
            }
          } catch (e) {
            console.warn('Could not parse createdAt date for admin news:', article.createdAt, e);
            publishDate = new Date().toISOString();
          }

          return {
            id: article.id || 'admin_' + Date.now() + '_' + index,
            title: article.header,
            content: article.text,
            summary: article.text.substring(0, 200) + (article.text.length > 200 ? '...' : ''),
            excerpt: article.text.substring(0, 150) + (article.text.length > 150 ? '...' : ''),
            imageUrl: article.imageUrl || undefined,
            publishDate: publishDate,
            category: 'ChessNews', // Always set as ChessNews for admin news
            categoryColor: '#D4AF37', // Gold color for ChessNews category
            author: article.author || 'ChessNews Editörü',
            source: 'local' as const,
            originalUrl: undefined, // Admin news don't have external URLs
            readTime: Math.ceil(article.text.length / 200) + ' dk',
            isBookmarked: false,
            isTrending: article.badge === 'ÖNEMLİ', // Mark as trending if badge is 'ÖNEMLİ'
            isNew: true // All admin news are marked as new
          };
        });
        
        console.log(`✅ NewsList: Mapped ${adminNews.length} admin news:`, adminNews);
      } catch (firebaseError) {
        console.error('❌ NewsList: Could not fetch admin news from Firebase:', firebaseError);
        // Continue without admin news if Firebase fails
      }

      if (scrapedResponse.success) {
        // Combine admin news with scraped news
        const combinedNews = [...adminNews, ...scrapedResponse.data];
        console.log('🔥 NewsList: Combined news before sorting:', combinedNews);
        console.log('🔥 NewsList: Admin news count:', adminNews.length);
        console.log('🔥 NewsList: Scraped news count:', scrapedResponse.data.length);
        
        // Sort by importance and date
        combinedNews.sort((a, b) => {
          // Admin news (local) get higher priority
          if (a.source === 'local' && b.source !== 'local') return -1;
          if (a.source !== 'local' && b.source === 'local') return 1;
          
          // Then sort by date
          const dateA = new Date(a.publishDate || 0).getTime();
          const dateB = new Date(b.publishDate || 0).getTime();
          return dateB - dateA;
        });
        
        console.log('🔥 NewsList: Final combined and sorted news:', combinedNews);
        setNews(combinedNews);
        setLastUpdated(scrapedResponse.lastUpdated);

        if (refresh) {
          showNotification(`Haberler başarıyla yenilendi! ${adminNews.length} admin, ${scrapedResponse.data.length} dış kaynak haberi. 🎉`, 'success');
        }
      } else {
        console.warn('🔥 NewsList: Scraped response not successful, using only admin news');
        // If external API fails but we have admin news, use only admin news
        if (adminNews.length > 0) {
          console.log('🔥 NewsList: Using only admin news:', adminNews);
          setNews(adminNews);
          setLastUpdated(new Date().toISOString());
          if (refresh) {
            showNotification(`ChessNews haberleri yüklendi (${adminNews.length} haber) ⚠️`, 'warning');
          }
        } else {
          throw new Error(scrapedResponse.message || 'API responded with success: false');
        }
      }
    } catch (err) {
      console.error('❌ NewsList: Error fetching news:', err);

      const error = err as ApiError;
      const errorMessage = error.userMessage || error.message || 'Haberler yüklenirken bir hata oluştu';
      const errorType: ErrorState['type'] = error.response?.status === 404 ? 'warning' : 'error';

      setError({
        message: errorMessage,
        type: errorType,
        details: error.response?.status ? `HTTP ${error.response.status}` : error.code
      });

      // If we have admin news from Firebase, show them even if backend fails
      // Re-fetch admin news in case the error happened before we could fetch them
      try {
        const firebaseNews = await getAllNews();
        if (firebaseNews.length > 0) {
          console.log('🔥 NewsList: Backend failed, but showing admin news from Firebase:', firebaseNews.length);
          const adminNewsOnly = firebaseNews.map((article, index) => ({
            id: article.id || 'admin_fallback_' + Date.now() + '_' + index,
            title: article.header,
            content: article.text,
            summary: article.text.substring(0, 200) + (article.text.length > 200 ? '...' : ''),
            excerpt: article.text.substring(0, 150) + (article.text.length > 150 ? '...' : ''),
            imageUrl: article.imageUrl || undefined,
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
            category: 'ChessNews',
            categoryColor: '#D4AF37',
            author: article.author || 'ChessNews Editörü',
            source: 'local' as const,
            originalUrl: undefined,
            readTime: Math.ceil(article.text.length / 200) + ' dk',
            isBookmarked: false,
            isTrending: article.badge === 'ÖNEMLİ',
            isNew: true
          }));
          setNews(adminNewsOnly);
          if (refresh) {
            showNotification(`Backend hatası! Sadece ChessNews haberleri gösteriliyor (${adminNewsOnly.length} haber).`, 'warning');
          }
          return; // Don't show fallback mock data if we have real admin news
        }
      } catch (firebaseError) {
        console.error('❌ NewsList: Firebase also failed:', firebaseError);
      }

      // Use mock data as fallback only if we have no admin news
      setNews(mockNews);

      if (refresh) {
        showNotification('Haberler yenilenirken hata oluştu. Mock veriler gösteriliyor.', 'warning');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Force refresh TSF news with better error handling


  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookmark = (articleId: string | number) => {
    const newBookmarked = new Set(bookmarkedArticles);
    if (newBookmarked.has(articleId)) {
      newBookmarked.delete(articleId);
    } else {
      newBookmarked.add(articleId);
    }
    setBookmarkedArticles(newBookmarked);
  };

  const handleShare = (article: NewsItem) => {
    const shareUrl = article.originalUrl || window.location.href;
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt || article.summary || article.content,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showNotification('Link panoya kopyalandı! 📋', 'success');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Filter and search logic
  const getUniqueCategories = () => {
    const categories = ['Tümü', 'ChessNews', 'Chess.com', 'TSF'];
    
    // Count news by category
    const counts: Record<string, number> = {
      'Tümü': news.length,
      'ChessNews': news.filter(article => article.source === 'local' || article.category === 'ChessNews').length,
      'Chess.com': news.filter(article => article.source === 'chesscom').length,
      'TSF': news.filter(article => article.source === 'tsf').length
    };
    
    news.forEach(article => {
      if (article.category &&
        !categories.includes(article.category) &&
        article.category !== 'Genel' &&
        article.category !== 'TSF Haberleri' &&
        article.category !== 'ChessNews') { // Exclude admin category from duplicate
        categories.push(article.category);
        // Count additional categories
        counts[article.category] = news.filter(a => a.category === article.category).length;
      }
    });
    
    return categories.map(cat => ({
      name: cat,
      count: counts[cat] || 0
    }));
  };

  const filteredNews = news.filter(article => {
    const matchesSearch = !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.excerpt || article.summary || article.content || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesCategory = false;
    if (selectedCategory === 'Tümü') {
      matchesCategory = true;
    } else if (selectedCategory === 'ChessNews') {
      // Show admin news (source: local) OR news with ChessNews category
      matchesCategory = article.source === 'local' || article.category === 'ChessNews';
    } else if (selectedCategory === 'Chess.com') {
      matchesCategory = article.source === 'chesscom';
    } else if (selectedCategory === 'TSF') {
      matchesCategory = article.source === 'tsf';
    } else {
      matchesCategory = article.category === selectedCategory;
    }

    // Debug log for filtering
    if (article.source === 'local') {
      console.log(`🔥 NewsList: Filtering admin news "${article.title}" - Category: ${selectedCategory}, Matches: ${matchesCategory}`);
    }

    return matchesSearch && matchesCategory;
  });

  // Debug log for final filtered results
  console.log(`🔥 NewsList: Filtered news (${selectedCategory}):`, filteredNews.length, 'items');

  // Ensure unique keys by adding source prefix and index if needed
  const getUniqueKey = (article: NewsItem, index: number): string => {
    const baseKey = `${article.source || 'unknown'}_${article.id}`;
    return `${baseKey}_${index}`;
  };

  const normalizeNewsItem = (item: NewsItem) => {
    const isAdminNews = item.source === 'local';
    
    return {
      ...item,
      excerpt: item.excerpt || item.summary || item.content?.substring(0, 200) + '...' || '',
      image: item.imageUrl || item.image,
      publishDate: item.publishDate || item.created_at || new Date().toISOString(),
      category: isAdminNews ? 'ChessNews' : (item.category || 'Haberler'),
      categoryColor: isAdminNews ? '#D4AF37' : (item.categoryColor || undefined),
      source: item.source || 'local',
      author: isAdminNews ? (item.author || 'ChessNews Editörü') : item.author,
      isNew: isAdminNews ? true : (item.isNew || false), // Admin news are always marked as new
      isTrending: item.isTrending || (isAdminNews && item.category === 'ÖNEMLİ'),
      readTime: item.readTime || (isAdminNews ? '3 dk' : undefined)
    };
  };

  const handleOpenModal = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
  };

  if (loading) {
    return (
      <NewsContainer>
        <HeroSection />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Box textAlign="center">
              <CircularProgress size={60} sx={{ color: '#D4AF37', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Satranç haberleri yükleniyor...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Backend sunucusuna bağlanılıyor...
              </Typography>
            </Box>
          </Box>
        </Container>
      </NewsContainer>
    );
  }

  return (
    <NewsContainer>
      <HeroSection />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert
            severity={error.type}
            icon={error.type === 'warning' ? <WarningIcon /> : undefined}
            sx={{
              mb: 3,
              borderRadius: '12px',
              '& .MuiAlert-message': {
                fontSize: '1rem'
              }
            }}
            action={
              error.type === 'warning' && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => fetchNews(true)}
                  disabled={refreshing}
                >
                  Tekrar Dene
                </Button>
              )
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

        {/* Controls Section */}
        <SearchSection elevation={0}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Search and Settings */}
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" flex={1} minWidth="300px">
                <SearchIcon sx={{ color: '#8D6E63', mr: 1 }} />
                <SearchInput
                  placeholder="Satranç haberlerini ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>

              <Button
                startIcon={<RefreshIcon />}
                onClick={() => fetchNews(true)}
                disabled={refreshing}
                sx={{
                  borderRadius: '12px',
                  color: 'white',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(212, 175, 55, 0.1)',
                    color: 'white',
                  },
                  '&.Mui-disabled': {
                    color: 'white !important',
                  }
                }}
              >
                {refreshing ? 'Yenileniyor...' : 'Haberleri Yenile'}
              </Button>
            </Box>

            {/* Category Filters */}
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <FilterIcon sx={{ color: '#8D6E63', mr: 1 }} />
              {getUniqueCategories().map((category) => (
                <FilterButton
                  key={category.name}
                  className={selectedCategory === category.name ? 'active' : ''}
                  onClick={() => setSelectedCategory(category.name)}
                  sx={{
                    ...(category.name === 'ChessNews' && {
                      background: selectedCategory === category.name 
                        ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' 
                        : 'rgba(212, 175, 55, 0.1)',
                      color: selectedCategory === category.name ? '#1a1a1a' : '#D4AF37',
                      border: '1px solid #D4AF37',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                        color: '#1a1a1a'
                      }
                    })
                  }}
                >
                  {category.name === 'ChessNews' ? '📰 ' : ''}{category.name}
                  {category.count > 0 && (
                    <span style={{ 
                      marginLeft: '6px', 
                      fontSize: '0.75rem',
                      opacity: 0.8,
                      fontWeight: 'normal'
                    }}>
                      ({category.count})
                    </span>
                  )}
                </FilterButton>
              ))}
            </Box>

            {/* Status Info */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredNews.length} haber bulundu
              </Typography>
              {lastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  Son güncelleme: {new Date(lastUpdated).toLocaleString('tr-TR')}
                </Typography>
              )}
            </Box>
          </Box>
        </SearchSection>

        {/* News Section */}
        <Box mb={4}>
          <SectionTitle variant="h2">
            En Son Haberler
          </SectionTitle>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
            {filteredNews.map((item, index) => {
              const normalizedItem = normalizeNewsItem(item);
              return (
                <div
                  key={getUniqueKey(item, index)}
                  style={{ flex: '1 1 300px', maxWidth: '350px', minWidth: '280px' }}
                >
                  <NewsCard
                    title={normalizedItem.title}
                    excerpt={normalizedItem.excerpt || ''}
                    image={normalizedItem.imageUrl}
                    category={normalizedItem.category || 'General'}
                    publishDate={normalizedItem.publishDate || new Date().toISOString()}
                    source={normalizedItem.source}
                    originalUrl={normalizedItem.originalUrl}
                    isBookmarked={bookmarkedArticles.has(normalizedItem.id)}
                    onBookmark={() => handleBookmark(normalizedItem.id)}
                    onShare={() => handleShare(normalizedItem)}
                    onClick={() => {
                      if (!normalizedItem.originalUrl) {
                        handleOpenModal(normalizedItem);
                      } else {
                        window.open(normalizedItem.originalUrl, '_blank');
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>

          {filteredNews.length === 0 && !loading && (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Arama kriterlerinize uygun haber bulunamadı
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Farklı anahtar kelimeler deneyebilir veya filtreleri temizleyebilirsiniz.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Back to Top Button */}
        {showBackToTop && (
          <BackToTopFab onClick={scrollToTop} size="medium">
            <ArrowUpIcon />
          </BackToTopFab>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
      <NewsDetailModal
        open={isModalOpen}
        onClose={handleCloseModal}
        newsItem={selectedNews}
      />
    </NewsContainer>
  );
};

export default NewsList;
