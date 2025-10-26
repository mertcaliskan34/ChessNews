import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  alpha,
  Skeleton
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  TrendingUp as TrendingIcon,
  AccessTime as TimeIcon,
  OpenInNew as ExternalLinkIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

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

interface FeaturedNewsCarouselProps {
  newsItems?: FeaturedNewsItem[];
  loading?: boolean;
  autoPlay?: boolean;
  interval?: number;
  showItemCount?: number;
}

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const CarouselContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '450px',
  borderRadius: '24px',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.1)}`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const NewsCard = styled(Card)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'row',
  background: 'transparent',
  boxShadow: 'none',
  animation: `${slideIn} 0.6s ease-out`,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const ImageSection = styled(Box)(({ theme }) => ({
  flex: '0 0 55%',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    flex: '0 0 50%',
  },
}));

const ContentSection = styled(CardContent)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  background: `linear-gradient(135deg, ${alpha('#FAFAFA', 0.95)} 0%, ${alpha('#F5F5DC', 0.95)} 100%)`,
  backdropFilter: 'blur(20px)',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3),
  },
}));

const NavigationButton = styled(IconButton)(() => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  background: `linear-gradient(135deg, ${alpha('#D4AF37', 0.9)} 0%, ${alpha('#FFD700', 0.9)} 100%)`,
  color: '#3E2723',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha('#D4AF37', 0.3)}`,
  width: '48px',
  height: '48px',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha('#FFD700', 0.95)} 0%, ${alpha('#FFA000', 0.95)} 100%)`,
    transform: 'translateY(-50%) scale(1.1)',
  },
  '&.left': {
    left: '16px',
  },
  '&.right': {
    right: '16px',
  },
}));

const IndicatorContainer = styled(Box)({
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '8px',
  zIndex: 10,
});

const Indicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active: boolean }>(({ theme, $active }) => ({
  width: $active ? '32px' : '12px',
  height: '12px',
  borderRadius: '6px',
  background: $active
    ? `linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)`
    : alpha(theme.palette.common.white, 0.4),
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    background: $active
      ? `linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)`
      : alpha(theme.palette.common.white, 0.6),
  },
}));

const ImportanceBadge = styled(Chip)(() => ({
  position: 'absolute',
  top: '16px',
  right: '16px',
  background: `linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)`,
  color: 'white',
  fontWeight: 'bold',
  zIndex: 5,
  '& .MuiChip-icon': {
    color: 'white',
  },
}));

const SkeletonCard = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  width: '100%',
});

const FeaturedNewsCarousel: React.FC<FeaturedNewsCarouselProps> = ({
  newsItems = [],
  loading = false,
  autoPlay = true,
  interval = 5000,
  showItemCount = 3
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Limit the news items to the specified count (default 3)
  const displayItems = newsItems.slice(0, showItemCount);

  const nextSlide = useCallback(() => {
    if (displayItems.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }
  }, [displayItems.length]);

  const prevSlide = useCallback(() => {
    if (displayItems.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length);
    }
  }, [displayItems.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered || loading || displayItems.length <= 1) return;

    const intervalId = setInterval(nextSlide, interval);
    return () => clearInterval(intervalId);
  }, [autoPlay, isHovered, loading, nextSlide, interval, displayItems.length]);

  // Reset index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= displayItems.length && displayItems.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, displayItems.length]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getImportanceLabel = (importance: number) => {
    if (importance >= 5) return 'ÇOK ÖNEMLİ';
    if (importance >= 4) return 'ÖNEMLİ';
    return 'POPÜLER';
  };

  const handleCardClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <CarouselContainer>
        <SkeletonCard>
          <Box sx={{ flex: '0 0 55%' }}>
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height="100%" 
              sx={{ borderRadius: '0 24px 24px 0' }}
            />
          </Box>
          <Box sx={{ flex: 1, p: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={100} height={24} />
            </Box>
            <Skeleton variant="text" width="100%" height={50} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" height={80} sx={{ mb: 3 }} />
            <Skeleton variant="text" width="60%" height={24} />
          </Box>
        </SkeletonCard>
      </CarouselContainer>
    );
  }

  if (!displayItems.length) {
    return (
      <CarouselContainer>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary'
          }}
        >
          <Typography variant="h6">Haber bulunamadı</Typography>
        </Box>
      </CarouselContainer>
    );
  }

  const currentArticle = displayItems[currentIndex];

  return (
    <CarouselContainer
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NewsCard key={`${currentArticle.id}_${currentIndex}`}>
        <ImageSection>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${currentArticle.imageUrl || 'https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=800&h=450&fit=crop&q=80'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${alpha('#3E2723', 0.1)} 0%, ${alpha('#D4AF37', 0.1)} 100%)`,
                zIndex: 1,
              }
            }}
          />
          
          {currentArticle.importance >= 4 && (
            <ImportanceBadge
              icon={<TrendingIcon />}
              label={getImportanceLabel(currentArticle.importance)}
              size="small"
            />
          )}
        </ImageSection>

        <ContentSection onClick={() => handleCardClick(currentArticle.originalUrl)}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={currentArticle.category}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                color: '#3E2723',
                fontWeight: 'bold',
              }}
            />
            <Chip 
              label={
                currentArticle.source === 'chessnews' ? '📰 ChessNews' :
                currentArticle.source === 'chesscom' ? '♟️ Chess.com' :
                currentArticle.source === 'tsf' ? '🏆 TSF' : 'Kaynak'
              }
              size="small"
              variant="outlined"
              sx={{
                borderColor: currentArticle.source === 'chessnews' ? '#D4AF37' : 
                           currentArticle.source === 'chesscom' ? '#4CAF50' : 
                           currentArticle.source === 'tsf' ? '#FF9800' : '#666',
                color: currentArticle.source === 'chessnews' ? '#D4AF37' : 
                       currentArticle.source === 'chesscom' ? '#4CAF50' : 
                       currentArticle.source === 'tsf' ? '#FF9800' : '#666',
                fontWeight: 500,
              }}
            />
            {currentArticle.tags?.slice(0, 1).map((tag) => (
              <Chip 
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ borderColor: '#ccc', color: '#666' }}
              />
            ))}
          </Box>

          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              color: '#3E2723',
              mb: 2,
              lineHeight: 1.2,
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              '&:hover': {
                color: '#D4AF37'
              },
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {currentArticle.title}
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              color: '#5D4037',
              mb: 3,
              lineHeight: 1.6,
              fontSize: '1.1rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {currentArticle.summary}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ fontSize: 20, color: '#8D6E63' }} />
              <Typography variant="body2" color="text.secondary">
                {formatDate(currentArticle.publishDate)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Devamını oku
              </Typography>
              <ExternalLinkIcon sx={{ fontSize: 18, color: '#D4AF37' }} />
            </Box>
          </Box>
        </ContentSection>
      </NewsCard>

      {/* Navigation Buttons */}
      {displayItems.length > 1 && (
        <>
          <NavigationButton
            className="left"
            onClick={prevSlide}
            aria-label="Önceki haber"
          >
            <ChevronLeftIcon />
          </NavigationButton>

          <NavigationButton
            className="right"
            onClick={nextSlide}
            aria-label="Sonraki haber"
          >
            <ChevronRightIcon />
          </NavigationButton>
        </>
      )}

      {/* Indicators */}
      {displayItems.length > 1 && (
        <IndicatorContainer>
          {displayItems.map((_, index) => (
            <Indicator
              key={index}
              $active={index === currentIndex}
              onClick={() => goToSlide(index)}
              aria-label={`Haber ${index + 1}`}
            />
          ))}
        </IndicatorContainer>
      )}

      {/* Item counter */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: alpha('#000', 0.6),
          color: 'white',
          px: 2,
          py: 0.5,
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: 500,
          zIndex: 10,
        }}
      >
        {currentIndex + 1} / {displayItems.length}
      </Box>
    </CarouselContainer>
  );
};

export default FeaturedNewsCarousel; 