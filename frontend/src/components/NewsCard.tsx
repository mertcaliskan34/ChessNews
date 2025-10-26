import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  AccessTime as TimeIcon,
  OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(() => ({
  backgroundColor: '#FAFAFA',
  borderRadius: '20px',
  boxShadow: '0 4px 20px rgba(61, 39, 35, 0.15)',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-12px)',
    boxShadow: '0 20px 40px rgba(61, 39, 35, 0.25)',
    '& .card-image': {
      transform: 'scale(1.05)',
    },
    '& .card-overlay': {
      opacity: 1,
    },
    '& .card-content': {
      transform: 'translateY(-4px)',
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  }
}));

const StyledCardMedia = styled(CardMedia)({
  height: 220,
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.4s ease',
});

const ImageOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(180deg, transparent 0%, rgba(61, 39, 35, 0.8) 100%)',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  display: 'flex',
  alignItems: 'flex-end',
  padding: '16px',
});

const CategoryChip = styled(Chip)({
  color: '#FAFAFA',
  fontWeight: 600,
  fontSize: '0.75rem',
  height: '24px',
  position: 'absolute',
  top: '12px',
  left: '12px',
  zIndex: 2,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
});

const SourceChip = styled(Chip)({
  color: '#FAFAFA',
  fontWeight: 600,
  fontSize: '0.7rem',
  height: '22px',
  position: 'absolute',
  top: '12px',
  right: '12px',
  zIndex: 2,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
});

const StyledCardContent = styled(CardContent)({
  padding: '20px',
  transition: 'transform 0.3s ease',
});

const TitleTypography = styled(Typography)({
  fontFamily: 'Playfair Display, serif',
  fontWeight: 700,
  fontSize: '1.25rem',
  color: '#3E2723',
  marginBottom: '8px',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  transition: 'color 0.3s ease',
  '&:hover': {
    color: '#D4AF37',
  }
});

const ExcerptTypography = styled(Typography)({
  color: '#8D6E63',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  marginBottom: '16px',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const MetaInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: '#BCAAA4',
  fontSize: '0.85rem',
  marginBottom: '16px',
});

const ActionButton = styled(IconButton)({
  padding: '8px',
  color: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: 'scale(1.1)',
  }
});

const AuthorSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderTop: '1px solid rgba(212, 175, 55, 0.2)',
});

interface NewsCardProps {
  title: string;
  excerpt: string;
  image?: string;
  category: string;
  categoryColor?: string;
  author?: string;
  authorAvatar?: string;
  publishDate: string;
  readTime?: string;
  isBookmarked?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  source?: 'local' | 'tsf' | 'chesscom';
  originalUrl?: string;
  onClick?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({
  title,
  excerpt,
  image,
  category,
  categoryColor = '#D4AF37',
  author,
  authorAvatar,
  publishDate,
  readTime,
  isBookmarked = false,
  isTrending = false,
  isNew = false,
  source = 'local',
  originalUrl,
  onClick,
  onBookmark,
  onShare,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays <= 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const getSourceInfo = () => {
    switch (source) {
      case 'tsf':
        return {
          label: 'TSF',
          color: '#1976d2',
          tooltip: 'Türkiye Satranç Federasyonu'
        };
      case 'chesscom':
        return {
          label: 'Chess.com',
          color: '#4CAF50',
          tooltip: 'Chess.com Uluslararası Satranç Platformu'
        };
      case 'local':
      default:
        return {
          label: 'ChessNews',
          color: '#D4AF37',
          tooltip: 'ChessNews Platformu'
        };
    }
  };

  const sourceInfo = getSourceInfo();

  const handleCardClick = () => {
    if ((source === 'tsf' || source === 'chesscom') && originalUrl) {
      // Open TSF or Chess.com news in new tab
      window.open(originalUrl, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      const shareUrl = (source === 'tsf' || source === 'chesscom') && originalUrl ? originalUrl : window.location.href;
      if (navigator.share) {
        navigator.share({
          title: title,
          text: excerpt,
          url: shareUrl,
        });
      } else {
        // Fallback to copying URL
        navigator.clipboard.writeText(shareUrl);
      }
    }
  };

  return (
    <StyledCard onClick={handleCardClick}>
      {image && (
        <StyledCardMedia
          className="card-image"
          image={image}
          title={title}
        >
          <CategoryChip
            label={category}
            style={{ backgroundColor: categoryColor }}
          />
          
          {/* Only show source chip if it's different from category (avoid duplicate ChessNews badges) */}
          {category !== 'ChessNews' && (
            <Tooltip title={sourceInfo.tooltip}>
              <SourceChip
                label={sourceInfo.label}
                style={{ backgroundColor: sourceInfo.color }}
              />
            </Tooltip>
          )}

          {/* Status badges positioned below category and source chips */}
          {isTrending && (
            <Tooltip title="Trend">
              <Chip
                label="TREND"
                size="small"
                sx={{
                  position: 'absolute',
                  top: '52px', // Increased from 44px to 52px for better spacing
                  left: '12px',
                  backgroundColor: '#FF5722',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: '20px',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
            </Tooltip>
          )}

          {isNew && (
            <Tooltip title="Yeni">
              <Chip
                label="YENİ"
                size="small"
                sx={{
                  position: 'absolute',
                  top: '52px', // Increased from 44px to 52px for better spacing
                  right: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: '20px',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
            </Tooltip>
          )}

          <ImageOverlay className="card-overlay">
            <Typography variant="body2" color="white" fontWeight={600}>
              {readTime || '3 dk okuma'}
            </Typography>
          </ImageOverlay>
        </StyledCardMedia>
      )}

      {!image && (
        <Box 
          sx={{ 
            height: 120, 
            bgcolor: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <CategoryChip
            label={category}
            style={{ backgroundColor: categoryColor }}
          />
          
          {/* Only show source chip if it's different from category (avoid duplicate ChessNews badges) */}
          {category !== 'ChessNews' && (
            <Tooltip title={sourceInfo.tooltip}>
              <SourceChip
                label={sourceInfo.label}
                style={{ backgroundColor: sourceInfo.color }}
              />
            </Tooltip>
          )}

          {/* Status badges for non-image cards */}
          {isTrending && (
            <Tooltip title="Trend">
              <Chip
                label="TREND"
                size="small"
                sx={{
                  position: 'absolute',
                  top: '52px', // Increased from 44px to 52px for better spacing
                  left: '12px',
                  backgroundColor: '#FF5722',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: '20px',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
            </Tooltip>
          )}

          {isNew && (
            <Tooltip title="Yeni">
              <Chip
                label="YENİ"
                size="small"
                sx={{
                  position: 'absolute',
                  top: '52px', // Increased from 44px to 52px for better spacing
                  right: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: '20px',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
            </Tooltip>
          )}

          <Typography variant="h6" color="white" fontWeight={700}>
            ♟️ Satranç Haberi
          </Typography>
        </Box>
      )}

      <StyledCardContent className="card-content">
        <TitleTypography variant="h6">
          {title}
        </TitleTypography>

        <ExcerptTypography variant="body2">
          {excerpt}
        </ExcerptTypography>

        <MetaInfo>
          <Box display="flex" alignItems="center" gap={0.5}>
            <TimeIcon fontSize="small" />
            <span>{formatDate(publishDate)}</span>
          </Box>
          {/* Removed view count display */}
        </MetaInfo>

        <AuthorSection>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              src={authorAvatar}
              sx={{ width: 32, height: 32, bgcolor: '#D4AF37' }}
            >
              {author ? author.charAt(0).toUpperCase() : 'S'}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {author || (source === 'tsf' ? 'TSF' : source === 'chesscom' ? 'Chess.com' : 'ChessNews')}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {(source === 'tsf' || source === 'chesscom') && originalUrl && (
              <Tooltip title="Orijinal haberi aç">
                <ActionButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(originalUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <ExternalLinkIcon fontSize="small" />
                </ActionButton>
              </Tooltip>
            )}

            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.();
              }}
            >
              {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </ActionButton>

            <ActionButton size="small" onClick={handleShare}>
              <ShareIcon fontSize="small" />
            </ActionButton>
          </Box>
        </AuthorSection>
      </StyledCardContent>
    </StyledCard>
  );
};

export default NewsCard; 