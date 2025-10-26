import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { newsAPI } from '../config/api';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;



const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const HeroContainer = styled(Box)({
  background: 'linear-gradient(135deg, #F5F5DC 0%, #FAFAFA 100%)',
  position: 'relative',
  overflow: 'hidden',
  padding: '80px 0 60px',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(93, 64, 55, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 70%)
    `,
    pointerEvents: 'none',
  }
});

const ChessIcon = styled('div')({
  fontSize: '4rem',
  opacity: 0.1,
  position: 'absolute',
  animation: `${float} 6s ease-in-out infinite`,
  color: '#D4AF37',
  userSelect: 'none',
});



const FeaturedCard = styled(Card)({
  background: 'rgba(250, 250, 250, 0.9)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(61, 39, 35, 0.12)',
  border: '1px solid rgba(212, 175, 55, 0.15)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 48px rgba(61, 39, 35, 0.2)',
  }
});

const HeroTitle = styled(Typography)({
  fontFamily: 'Playfair Display, serif',
  fontWeight: 800,
  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
  background: 'linear-gradient(135deg, #3E2723 0%, #D4AF37 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '1rem',
  animation: `${slideInLeft} 1s ease-out`,
});

const HeroSubtitle = styled(Typography)({
  fontSize: '1.3rem',
  color: '#8D6E63',
  fontWeight: 400,
  lineHeight: 1.6,
  marginBottom: '2rem',
  animation: `${slideInLeft} 1s ease-out 0.2s both`,
});

const ActionButton = styled(Button)({
  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
  color: '#3E2723',
  fontWeight: 700,
  fontSize: '1.1rem',
  padding: '16px 32px',
  borderRadius: '16px',
  textTransform: 'none',
  boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${slideInLeft} 1s ease-out 0.4s both`,
  '&:hover': {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 35px rgba(212, 175, 55, 0.4)',
  }
});

const StatsBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  padding: '20px',
  background: 'rgba(250, 250, 250, 0.7)',
  borderRadius: '16px',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  backdropFilter: 'blur(10px)',
});

const StatItem = styled(Box)({
  textAlign: 'center',
  '& .stat-number': {
    fontFamily: 'Playfair Display, serif',
    fontWeight: 700,
    fontSize: '2rem',
    color: '#D4AF37',
    display: 'block',
  },
  '& .stat-label': {
    fontSize: '0.9rem',
    color: '#8D6E63',
    fontWeight: 500,
  }
});

interface NewsApiItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  imageUrl?: string | null;
  originalUrl?: string;
  publishDate: string;
  category: string;
  importance?: number;
  tags?: string[];
  source: string;
}

interface FeaturedArticle {
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
  readTime?: string;
  isTrending?: boolean;
  isNew?: boolean;
}

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real news data from backend
  const fetchFeaturedArticles = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.getFeaturedNews('3'); // Get top 3 articles
      
      if (response.success && response.data) {
        const articles: FeaturedArticle[] = response.data.map((item: NewsApiItem, index: number) => ({
          id: item.id,
          title: item.title,
          summary: item.summary || item.content || 'İçerik özeti mevcut değil.',
          imageUrl: item.imageUrl,
          originalUrl: item.originalUrl,
          publishDate: item.publishDate,
          category: item.category,
          importance: item.importance || 3,
          tags: item.tags || [],
          source: item.source,
          readTime: `${Math.floor(Math.random() * 5) + 5} dk`, // Generate random read time
          isTrending: item.importance && item.importance >= 5,
          isNew: index === 0, // Mark first article as new
        }));
        
        setFeaturedArticles(articles);
        setError(null);
      } else {
        throw new Error(response.error || 'Haberler yüklenemedi');
      }
    } catch (err) {
      console.error('Error fetching featured articles:', err);
      setError('Haberler yüklenirken bir hata oluştu');
      
      // Fallback: use minimal mock data only if API completely fails
      setFeaturedArticles([
        {
          id: 'fallback-1',
          title: 'Satranç Haberleri Yükleniyor...',
          summary: 'En güncel satranç haberlerini size ulaştırmak için çalışıyoruz.',
          imageUrl: 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=800&h=450&fit=crop',
          originalUrl: 'https://www.chess.com',
          publishDate: new Date().toISOString(),
          category: 'Genel',
          importance: 3,
          tags: ['haber', 'güncel'],
          source: 'local',
          readTime: '2 dk',
          isTrending: false,
          isNew: true,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedArticles();
  }, []);

  // Auto-rotate featured articles
  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredArticles.length]);

  const currentArticle = featuredArticles[currentSlide] || featuredArticles[0];

  return (
    <HeroContainer>
      {/* Floating Chess Pieces */}
      <ChessIcon style={{ top: '10%', left: '5%', animationDelay: '0s' }}>♔</ChessIcon>
      <ChessIcon style={{ top: '20%', right: '10%', animationDelay: '2s' }}>♕</ChessIcon>
      <ChessIcon style={{ bottom: '15%', left: '8%', animationDelay: '4s' }}>♗</ChessIcon>
      <ChessIcon style={{ bottom: '25%', right: '5%', animationDelay: '1s' }}>♘</ChessIcon>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 6, alignItems: 'center' }}>
          {/* Left Content */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', lg: 'left' } }}>
            <HeroTitle>
              Satranç Dünyasının
              <br />
              Dijital Kalbi
            </HeroTitle>
            
            <HeroSubtitle>
              Grandmaster analizlerinden turnuva sonuçlarına, taktik bulmacalarından 
              son dakika haberlerine kadar satranç evreninin her köşesini keşfedin.
            </HeroSubtitle>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', lg: 'flex-start' }, mb: 4 }}>
              <ActionButton
                endIcon={<ArrowForwardIcon />}
                size="large"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                Haberleri Keşfet
              </ActionButton>
            </Box>

            {/* Stats */}
            <StatsBox sx={{ display: { xs: 'none', md: 'flex' } }}>
              <StatItem>
                <span className="stat-number">500+</span>
                <span className="stat-label">Günlük Haber</span>
              </StatItem>
              <StatItem>
                <span className="stat-number">10K+</span>
                <span className="stat-label">Aktif Okuyucu</span>
              </StatItem>
              <StatItem>
                <span className="stat-number">24/7</span>
                <span className="stat-label">Canlı Güncelleme</span>
              </StatItem>
            </StatsBox>
          </Box>

          {/* Right Content - Dynamic Featured Article */}
          <Box sx={{ flex: 1, maxWidth: '500px' }}>
            {loading ? (
              <FeaturedCard>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ color: '#D4AF37', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    En güncel haberler yükleniyor...
                  </Typography>
                </Box>
              </FeaturedCard>
            ) : error ? (
              <FeaturedCard>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" color="error" sx={{ mb: 1 }}>
                    Haberler Yüklenemedi
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {error}
                  </Typography>
                  <Button 
                    onClick={fetchFeaturedArticles}
                    variant="outlined"
                    size="small"
                    sx={{ color: '#D4AF37', borderColor: '#D4AF37' }}
                  >
                    Tekrar Dene
                  </Button>
                </Box>
              </FeaturedCard>
            ) : currentArticle ? (
              <FeaturedCard>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={currentArticle.imageUrl || 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=800&h=450&fit=crop'}
                    alt={currentArticle.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=800&h=450&fit=crop';
                    }}
                  />
                  
                  {currentArticle.isTrending && (
                    <Chip
                      label="TREND"
                      sx={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: '#FF5722',
                        color: '#FAFAFA',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: '20px',
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  )}
                  
                  {currentArticle.isNew && (
                    <Chip
                      label="YENİ"
                      sx={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#4CAF50',
                        color: '#FAFAFA',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: '20px',
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={currentArticle.category}
                      sx={{
                        backgroundColor: '#D4AF37',
                        color: '#FAFAFA',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                    <Chip
                      label={currentArticle.source === 'chesscom' ? 'Chess.com' : 'TSF'}
                      sx={{
                        backgroundColor: '#D4AF37',
                        color: '#FAFAFA',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </Box>

                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontFamily: 'Playfair Display, serif',
                      fontWeight: 700,
                      color: '#3E2723',
                      mb: 2,
                      lineHeight: 1.3,
                      cursor: 'pointer',
                      '&:hover': { color: '#D4AF37' },
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    onClick={() => currentArticle.originalUrl && window.open(currentArticle.originalUrl, '_blank')}
                  >
                    {currentArticle.title}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#5D4037',
                      mb: 2,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {currentArticle.summary}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon sx={{ fontSize: 16, color: '#8D6E63' }} />
                      <Typography variant="caption" color="text.secondary">
                        {currentArticle.readTime}
                      </Typography>
                    </Box>
                    
                    {featuredArticles.length > 1 && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {featuredArticles.map((_, index) => (
                          <Box
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: index === currentSlide ? '#D4AF37' : 'rgba(212, 175, 55, 0.3)',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: '#D4AF37',
                                transform: 'scale(1.2)',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </FeaturedCard>
            ) : null}
          </Box>
        </Box>
      </Container>
    </HeroContainer>
  );
};

export default HeroSection; 