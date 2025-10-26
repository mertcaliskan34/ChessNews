import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Alert,
    CircularProgress,
    Chip,
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { getAllNews, addNews, updateNews, deleteNews, NewsArticle } from '../firebase/news';

interface NewsFormData {
    header: string;
    text: string;
    imageUrl: string;
    category: string;
    author: string;
    badge: string;
}

const AdminNewsPage: React.FC = () => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
    const [formData, setFormData] = useState<NewsFormData>({
        header: '',
        text: '',
        imageUrl: '',
        category: '',
        author: '',
        badge: ''
    });

    const newsCategories = ['Turnuvalar', 'Türkiye', 'Online', 'Teknoloji', 'Genel'];
    const newsBadges = ['ÖNEMLİ', 'GÜNCEL', 'ANALİZ', ''];

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const newsData = await getAllNews();
            setNews(newsData);
        } catch (err: unknown) {
            setError('Haberler yüklenirken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (newsItem?: NewsArticle) => {
        if (newsItem) {
            setEditingNews(newsItem);
            setFormData({
                header: newsItem.header,
                text: newsItem.text,
                imageUrl: newsItem.imageUrl || '',
                category: newsItem.category || '',
                author: newsItem.author || '',
                badge: newsItem.badge || ''
            });
        } else {
            setEditingNews(null);
            setFormData({
                header: '',
                text: '',
                imageUrl: '',
                category: '',
                author: '',
                badge: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingNews(null);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async () => {
        if (!formData.header || !formData.text || !formData.category || !formData.author) {
            setError('Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            if (editingNews && editingNews.id) {
                await updateNews(editingNews.id, {
                    header: formData.header,
                    text: formData.text,
                    imageUrl: formData.imageUrl.trim() || undefined,
                    category: formData.category,
                    author: formData.author,
                    badge: formData.badge.trim() || undefined
                });
                setSuccess('Haber başarıyla güncellendi!');
            } else {
                await addNews({
                    header: formData.header,
                    text: formData.text,
                    imageUrl: formData.imageUrl.trim() || undefined,
                    category: formData.category,
                    author: formData.author,
                    badge: formData.badge.trim() || undefined
                });
                setSuccess('Haber başarıyla eklendi!');
            }
            handleCloseDialog();
            fetchNews(); // Refresh the list
        } catch (err: unknown) {
            setError(`Haber kaydedilirken hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteNews(id);
            setSuccess('Haber başarıyla silindi!');
            fetchNews();
        } catch (err: unknown) {
            setError(`Haber silinirken hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
        }
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'Tarih yok';
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Paper elevation={6} sx={{ p: 4, background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            color: '#D4AF37',
                            fontFamily: 'Playfair Display, serif',
                            fontWeight: 700
                        }}
                    >
                        📰 Haber Yönetimi
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            backgroundColor: '#D4AF37',
                            color: '#3E2723',
                            fontWeight: 600,
                            '&:hover': { backgroundColor: '#B8941F' }
                        }}
                    >
                        Yeni Haber Ekle
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Resim</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Başlık</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Kategori</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Yazar</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Rozet</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Tarih</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }} align="center">İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {news.map((item) => (
                                <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                                    <TableCell>
                                        <Avatar
                                            src={item.imageUrl}
                                            sx={{ width: 50, height: 50 }}
                                            variant="rounded"
                                        >
                                            📰
                                        </Avatar>
                                    </TableCell>
                                    <TableCell sx={{ color: '#FAFAFA', maxWidth: 300 }}>
                                        <Typography variant="body2" sx={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap' 
                                        }}>
                                            {item.header}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={item.category} 
                                            size="small" 
                                            sx={{ backgroundColor: '#D4AF37', color: '#3E2723' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#BCAAA4' }}>{item.author}</TableCell>
                                    <TableCell>
                                        {item.badge && (
                                            <Chip 
                                                label={item.badge} 
                                                size="small" 
                                                sx={{ backgroundColor: '#FF9800', color: 'white' }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: '#BCAAA4' }}>
                                        {formatDate(item.createdAt)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: '#FF9800' }}
                                                onClick={() => handleOpenDialog(item)}
                                                title="Düzenle"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: '#F44336' }}
                                                title="Sil"
                                                onClick={() => handleDelete(item.id!)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {news.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: '#BCAAA4' }}>
                            Henüz hiç haber eklenmemiş.
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    sx: { backgroundColor: '#3E2723', color: '#FAFAFA' }
                }}
            >
                <DialogTitle sx={{ color: '#D4AF37' }}>
                    {editingNews ? 'Haber Düzenle' : 'Yeni Haber Ekle'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Başlık *"
                            value={formData.header}
                            onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <TextField
                            fullWidth
                            label="İçerik *"
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            multiline
                            rows={4}
                            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <TextField
                            fullWidth
                            label="Resim URL"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <FormControl fullWidth sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                            <InputLabel>Kategori *</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                label="Kategori *"
                            >
                                {newsCategories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Yazar *"
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <FormControl fullWidth sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                            <InputLabel>Rozet</InputLabel>
                            <Select
                                value={formData.badge}
                                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                label="Rozet"
                            >
                                {newsBadges.map((badge) => (
                                    <MenuItem key={badge} value={badge}>{badge || 'Rozet Yok'}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} sx={{ color: '#BCAAA4' }}>
                        İptal
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        sx={{ backgroundColor: '#D4AF37', color: '#3E2723' }}
                    >
                        {editingNews ? 'Güncelle' : 'Ekle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminNewsPage; 