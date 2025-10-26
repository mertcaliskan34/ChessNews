import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  CardMedia,
  Chip,
  Avatar,
  Paper
} from '@mui/material';
import { Close as CloseIcon, CalendarToday, AccountCircle } from '@mui/icons-material';

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
  author?: string;
  authorAvatar?: string;
  readTime?: string;
  source?: 'local' | 'tsf' | 'chesscom';
}

interface NewsDetailModalProps {
  open: boolean;
  onClose: () => void;
  newsItem: NewsItem | null;
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '700px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  outline: 'none',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ open, onClose, newsItem }) => {
  if (!newsItem) return null;
  const { title, content, imageUrl, publishDate, author, category, source } = newsItem;

  return (
    <Modal open={open} onClose={onClose}>
      <Paper sx={modalStyle}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
        {imageUrl && (
          <CardMedia
            component="img"
            height="250"
            image={imageUrl}
            alt={title}
            sx={{ borderRadius: '8px', marginBottom: '24px' }}
          />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {category && <Chip label={category} color="primary" sx={{ mr: 1 }} />}
          {source && <Chip label={source.toUpperCase()} variant="outlined" />}
        </Box>
        <Typography variant="h4" component="h2" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 3 }}>
          {author && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                <AccountCircle />
              </Avatar>
              <Typography variant="body2">{author}</Typography>
            </Box>
          )}
          {publishDate && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarToday sx={{ fontSize: '1rem', mr: 0.5 }}/>
              <Typography variant="body2">{new Date(publishDate).toLocaleDateString('tr-TR')}</Typography>
            </Box>
          )}
        </Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {content || "İçerik yüklenemedi."}
        </Typography>
      </Paper>
    </Modal>
  );
};

export default NewsDetailModal; 