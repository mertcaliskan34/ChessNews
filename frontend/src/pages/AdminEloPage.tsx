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
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    TrendingUp as EloIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

// Backend API'den gelen veri yapısı
interface EloEntry {
    id: string;
    title: string | null;
    name: string;
    rating: number;
    games: number;
    birthYear: number;
}

interface EloFormData {
    playerName: string;
    elo: string;
    country: string;
    title: string;
    rank: string;
}

const AdminEloPage: React.FC = () => {
    const [eloRatings, setEloRatings] = useState<EloEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingElo, setEditingElo] = useState<EloEntry | null>(null);
    const [formData, setFormData] = useState<EloFormData>({
        playerName: '',
        elo: '',
        country: '',
        title: '',
        rank: ''
    });

    const chessTitles = ['GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'WFM', 'WCM', ''];

    useEffect(() => {
        fetchEloRatings();
    }, []);

    const fetchEloRatings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/elo');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: EloEntry[] = await response.json();
            // ELO'ya göre sırala (yüksekten düşüğe)
            data.sort((a, b) => b.rating - a.rating);
            setEloRatings(data);
            setError('');
        } catch (err: unknown) {
            setError('ELO puanları yüklenirken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchEloRatings();
        setSuccess('Veriler yenilendi!');
    };

    const handleOpenDialog = (eloRating?: EloEntry) => {
        if (eloRating) {
            setEditingElo(eloRating);
            setFormData({
                playerName: eloRating.name,
                elo: eloRating.rating.toString(),
                country: 'Türkiye', // Backend'de ülke bilgisi yok, varsayılan olarak Türkiye
                title: eloRating.title || '',
                rank: ''
            });
        } else {
            setEditingElo(null);
            setFormData({
                playerName: '',
                elo: '',
                country: '',
                title: '',
                rank: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingElo(null);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async () => {
        if (!formData.playerName || !formData.elo) {
            setError('Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            // Backend API'ye yeni ELO ekleme endpoint'i yoksa, sadece başarı mesajı göster
            setSuccess('ELO puanı başarıyla eklendi! (Not: Backend API entegrasyonu gerekli)');
            handleCloseDialog();
            fetchEloRatings(); // Refresh the list
        } catch (err: unknown) {
            setError(`ELO puanı eklenirken hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
        }
    };

    const getTitleColor = (title?: string | null) => {
        switch (title) {
            case 'GM': return '#FFD700';
            case 'IM': return '#C0C0C0';
            case 'FM': return '#CD7F32';
            case 'WGM': return '#FFB6C1';
            default: return '#90EE90';
        }
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
                        📊 ELO Puanı Yönetimi (TSF Verileri)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            sx={{
                                borderColor: '#D4AF37',
                                color: '#D4AF37',
                                fontWeight: 600,
                                '&:hover': { 
                                    borderColor: '#B8941F',
                                    backgroundColor: 'rgba(212, 175, 55, 0.1)'
                                }
                            }}
                        >
                            Yenile
                        </Button>
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
                            Yeni ELO Ekle
                        </Button>
                    </Box>
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

                <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: '#D4AF37', mb: 1 }}>
                        📈 Toplam Kayıt: {eloRatings.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#BCAAA4' }}>
                        TSF'den çekilen güncel ELO verileri
                    </Typography>
                </Box>

                <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Sıra</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Oyuncu</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Unvan</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>ELO</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Oyun Sayısı</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Doğum Yılı</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>FIDE ID</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {eloRatings.map((rating, index) => (
                                <TableRow key={rating.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                                    <TableCell>
                                        <Chip 
                                            label={`#${index + 1}`} 
                                            size="small" 
                                            sx={{ 
                                                backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#90EE90',
                                                color: '#000',
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#FAFAFA', fontWeight: 600 }}>
                                        {rating.name}
                                    </TableCell>
                                    <TableCell>
                                        {rating.title && (
                                            <Chip 
                                                label={rating.title} 
                                                size="small" 
                                                sx={{ 
                                                    backgroundColor: getTitleColor(rating.title),
                                                    color: '#000',
                                                    fontWeight: 600
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <EloIcon sx={{ color: '#4CAF50' }} />
                                            <Typography sx={{ color: '#4CAF50', fontWeight: 600, fontSize: '1.1rem' }}>
                                                {rating.rating}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#FAFAFA' }}>
                                        {rating.games}
                                    </TableCell>
                                    <TableCell sx={{ color: '#FAFAFA' }}>
                                        {rating.birthYear}
                                    </TableCell>
                                    <TableCell>
                                        <a 
                                            href={`https://ratings.fide.com/profile/${rating.id}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                                color: '#D4AF37', 
                                                textDecoration: 'none',
                                                fontWeight: 600
                                            }}
                                        >
                                            {rating.id}
                                        </a>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog for adding/editing ELO */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#3E2723', color: '#D4AF37' }}>
                    {editingElo ? 'ELO Puanını Düzenle' : 'Yeni ELO Puanı Ekle'}
                </DialogTitle>
                <DialogContent sx={{ backgroundColor: '#5D4037', pt: 2 }}>
                    <TextField
                        fullWidth
                        label="Oyuncu Adı"
                        value={formData.playerName}
                        onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.9)' } }}
                    />
                    <TextField
                        fullWidth
                        label="ELO Puanı"
                        type="number"
                        value={formData.elo}
                        onChange={(e) => setFormData({ ...formData, elo: e.target.value })}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.9)' } }}
                    />
                    <TextField
                        fullWidth
                        label="Ülke"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.9)' } }}
                    />
                    <FormControl fullWidth sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                        <InputLabel>Unvan</InputLabel>
                        <Select
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            label="Unvan"
                        >
                            {chessTitles.map((title) => (
                                <MenuItem key={title} value={title}>
                                    {title || 'Unvan Yok'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ backgroundColor: '#5D4037' }}>
                    <Button onClick={handleCloseDialog} sx={{ color: '#BCAAA4' }}>
                        İptal
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        sx={{ 
                            backgroundColor: '#D4AF37', 
                            color: '#3E2723',
                            '&:hover': { backgroundColor: '#B8941F' }
                        }}
                    >
                        {editingElo ? 'Güncelle' : 'Ekle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminEloPage; 