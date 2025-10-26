import React from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  alpha,
  Grid,
  Skeleton
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  AccessTime as TimeIcon,
  OpenInNew as ExternalLinkIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

interface FeaturedNewsSectionProps {
  newsItems?: FeaturedNewsItem[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

const SectionContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 0),
  background: `linear-gradient(135deg, ${alpha('#F5F5DC', 0.3)} 0%, ${alpha('#FAFAFA', 0.3)} 100%)`,
  borderRadius: '24px',
  margin: theme.spacing(4, 0),
}));

const SectionTitle = styled(Typography)({
  fontFamily: 'Playfair Display, serif',
  fontWeight: 700,
  fontSize: '2.5rem',
  color: '#3E2723',
  marginBottom: '1rem',
  textAlign: 'center',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80px',
    height: '4px',
    background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
    borderRadius: '2px',
  }
});

const SectionSubtitle = styled(Typography)({
  textAlign: 'center',
  color: '#666',
  marginBottom: '2rem',
  fontSize: '1.1rem',
  fontWeight: 500,
});

const FeaturedCard = styled(Card)(() => ({
  height: '100%',
  borderRadius: '20px',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#FAFAFA', 0.95)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha('#D4AF37', 0.1)}`,
  boxShadow: `0 12px 40px ${alpha('#3E2723', 0.08)}`,
  cursor: 'pointer',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 60px ${alpha('#3E2723', 0.15)}`,
    '& .card-image': {
      transform: 'scale(1.05)',
    },
    '& .card-title': {
      color: '#D4AF37',
    }
  },
}));

const StyledCardMedia = styled(CardMedia)({
  height: '280px',
  position: 'relative',
  overflow: 'hidden',
  '&.card-image': {
    transition: 'transform 0.6s ease',
  }
});

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

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  height: 'calc(100% - 280px)',
  display: 'flex',
  flexDirection: 'column',
}));

const SkeletonCard = styled(Card)({
  height: '500px',
  borderRadius: '20px',
});

const FeaturedNewsSection: React.FC<FeaturedNewsSectionProps> = ({
  newsItems = [],
  loading = false,
  title = "Öne Çıkan Haberler",
  subtitle
}) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getImportanceLabel = (importance: number) => {
    if (importance >= 5) return 'Çok Önemli';
    if (importance >= 4) return 'Önemli';
    return 'Popüler';
  };

  const handleCardClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <SectionContainer>
        <SectionTitle variant="h2">{title}</SectionTitle>
        {subtitle && <SectionSubtitle variant="body1">{subtitle}</SectionSubtitle>}
        <Grid container spacing={4} justifyContent="center">
          {[1, 2, 3, 4].map((index) => (
            <Grid size={{ xs: 12, md: 6, lg: 6 }} key={index}>
              <SkeletonCard>
                <Skeleton
                  variant="rectangular"
                  height={280}
                  sx={{ borderRadius: '20px 20px 0 0' }}
                />
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Skeleton variant="rounded" width={80} height={24} />
                    <Skeleton variant="rounded" width={100} height={24} />
                  </Box>
                  <Skeleton variant="text" width="100%" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="100%" height={60} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="70%" height={24} />
                </Box>
              </SkeletonCard>
            </Grid>
          ))}
        </Grid>
      </SectionContainer>
    );
  }

  if (!newsItems.length) {
    return (
      <SectionContainer>
        <SectionTitle variant="h2">{title}</SectionTitle>
        {subtitle && <SectionSubtitle variant="body1">{subtitle}</SectionSubtitle>}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            color: 'text.secondary'
          }}
        >
          <Typography variant="h6">Öne çıkan haber bulunamadı</Typography>
        </Box>
      </SectionContainer>
    );
  }

  // Ensure we show exactly 4 items for featured section (2x2 grid)
  const featuredItems = newsItems.slice(0, 4);

  return (
    <SectionContainer>
      <SectionTitle variant="h2">{title}</SectionTitle>
      {subtitle && <SectionSubtitle variant="body1">{subtitle}</SectionSubtitle>}
      
      <Grid container spacing={4} justifyContent="center">
        {featuredItems.map((article, index) => (
          <Grid size={{ xs: 12, md: 6, lg: 6 }} key={`${article.id}_${index}`}>
            <FeaturedCard onClick={() => handleCardClick(article.originalUrl)}>
              {article.importance >= 4 && (
                <ImportanceBadge
                  icon={<TrendingIcon />}
                  label={getImportanceLabel(article.importance)}
                  size="small"
                />
              )}
              
              <StyledCardMedia
                className="card-image"
                image={
                  article.imageUrl || 
                  `https://images.unsplash.com/photo-1606166187734-76093fa9c3d6?w=600&h=400&fit=crop&q=80`
                }
                title={article.title}
              />
              
              <StyledCardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={article.category}
                    size="small"
                    sx={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                      color: '#3E2723',
                      fontWeight: 'bold',
                    }}
                  />
                  <Chip 
                    label={
                      article.source === 'chessnews' ? '📰 ChessNews' :
                      article.source === 'chesscom' ? '♟️ Chess.com' :
                      article.source === 'tsf' ? '🏆 TSF' : 'Kaynak'
                    }
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: article.source === 'chessnews' ? '#D4AF37' : 
                                 article.source === 'chesscom' ? '#4CAF50' : 
                                 article.source === 'tsf' ? '#FF9800' : '#666',
                      color: article.source === 'chessnews' ? '#D4AF37' : 
                             article.source === 'chesscom' ? '#4CAF50' : 
                             article.source === 'tsf' ? '#FF9800' : '#666',
                      fontWeight: 500,
                    }}
                  />
                  {article.tags?.slice(0, 1).map((tag) => (
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
                  variant="h5" 
                  className="card-title"
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 2,
                    fontSize: '1.4rem',
                    lineHeight: 1.3,
                    color: '#3E2723',
                    transition: 'color 0.3s ease',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.title}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ 
                    mb: 3,
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.summary}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mt: 'auto'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon sx={{ fontSize: '1rem', color: '#999' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(article.publishDate)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Devamını oku
                    </Typography>
                    <ExternalLinkIcon sx={{ fontSize: '1rem', color: '#D4AF37' }} />
                  </Box>
                </Box>
              </StyledCardContent>
            </FeaturedCard>
          </Grid>
        ))}
      </Grid>
      
      {/* Show count information */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          {featuredItems.length} öne çıkan haber gösteriliyor • Kaynaklar: ChessNews + Chess.com + TSF
        </Typography>
      </Box>
    </SectionContainer>
  );
};

export default FeaturedNewsSection; 