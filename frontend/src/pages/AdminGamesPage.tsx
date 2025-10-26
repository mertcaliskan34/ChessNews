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
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { getAllClassicGames, addClassicGame, updateClassicGame, deleteClassicGame, ClassicGame } from '../firebase/classicGames';

interface GameFormData {
    title: string;
    pgn: string;
    whitePlayer: string;
    blackPlayer: string;
    year: string;
    event: string;
    description: string;
}

const AdminGamesPage: React.FC = () => {
    const [games, setGames] = useState<ClassicGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingGame, setEditingGame] = useState<ClassicGame | null>(null);
    const [formData, setFormData] = useState<GameFormData>({
        title: '',
        pgn: '',
        whitePlayer: '',
        blackPlayer: '',
        year: '',
        event: '',
        description: ''
    });

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            setLoading(true);
            const gamesData = await getAllClassicGames();
            setGames(gamesData);
        } catch (err: unknown) {
            setError('Oyunlar yüklenirken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (game?: ClassicGame) => {
        if (game) {
            setEditingGame(game);
            setFormData({
                title: game.title,
                pgn: game.pgn,
                whitePlayer: game.whitePlayer || '',
                blackPlayer: game.blackPlayer || '',
                year: game.year?.toString() || '',
                event: game.event || '',
                description: ''
            });
        } else {
            setEditingGame(null);
            setFormData({
                title: '',
                pgn: '',
                whitePlayer: '',
                blackPlayer: '',
                year: '',
                event: '',
                description: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingGame(null);
        setError('');
        setSuccess('');
    };

    const handleDelete = async (game: ClassicGame) => {
        if (!window.confirm(`"${game.title}" oyununu silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            if (game.id) {
                await deleteClassicGame(game.id);
                setSuccess('Oyun başarıyla silindi!');
                fetchGames(); // Refresh the list
            }
        } catch (err: unknown) {
            setError(`Oyun silinirken hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.pgn || !formData.whitePlayer || !formData.blackPlayer) {
            setError('Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            const gameData = {
                title: formData.title,
                pgn: formData.pgn,
                whitePlayer: formData.whitePlayer,
                blackPlayer: formData.blackPlayer,
                year: formData.year ? parseInt(formData.year) : undefined,
                event: formData.event.trim() || undefined
            };

            if (editingGame && editingGame.id) {
                // Update existing game
                await updateClassicGame(editingGame.id, gameData);
                setSuccess('Oyun başarıyla güncellendi!');
            } else {
                // Create new game
                await addClassicGame(gameData);
                setSuccess('Oyun başarıyla eklendi!');
            }
            
            handleCloseDialog();
            fetchGames(); // Refresh the list
        } catch (err: unknown) {
            setError(`${editingGame ? 'Oyun güncellenirken' : 'Oyun eklenirken'} hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
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
                        ♔ Klasik Oyun Yönetimi
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
                        Yeni Oyun Ekle
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
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Başlık</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Beyaz</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Siyah</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Yıl</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600 }}>Etkinlik</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 600, textAlign: 'center' }}>İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {games.map((game) => (
                                <TableRow key={game.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                                    <TableCell sx={{ color: '#FAFAFA', maxWidth: 250 }}>
                                        <Typography variant="body2" sx={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap' 
                                        }}>
                                            {game.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: '#BCAAA4' }}>{game.whitePlayer}</TableCell>
                                    <TableCell sx={{ color: '#BCAAA4' }}>{game.blackPlayer}</TableCell>
                                    <TableCell>
                                        {game.year && (
                                            <Chip 
                                                label={game.year} 
                                                size="small" 
                                                sx={{ backgroundColor: '#4CAF50', color: 'white' }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: '#BCAAA4', maxWidth: 200 }}>
                                        <Typography variant="body2" sx={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap' 
                                        }}>
                                            {game.event || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: '#FF9800' }}
                                                onClick={() => handleOpenDialog(game)}
                                                title="Düzenle"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                sx={{ color: '#F44336' }}
                                                onClick={() => handleDelete(game)}
                                                title="Sil"
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

                {games.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: '#BCAAA4' }}>
                            Henüz hiç klasik oyun eklenmemiş.
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
                    {editingGame ? 'Oyun Düzenle' : 'Yeni Oyun Ekle'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Başlık *"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Beyaz Oyuncu *"
                                value={formData.whitePlayer}
                                onChange={(e) => setFormData({ ...formData, whitePlayer: e.target.value })}
                                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                            />
                            <TextField
                                fullWidth
                                label="Siyah Oyuncu *"
                                value={formData.blackPlayer}
                                onChange={(e) => setFormData({ ...formData, blackPlayer: e.target.value })}
                                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Yıl"
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                            />
                            <TextField
                                fullWidth
                                label="Etkinlik"
                                value={formData.event}
                                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="PGN *"
                            value={formData.pgn}
                            onChange={(e) => setFormData({ ...formData, pgn: e.target.value })}
                            multiline
                            rows={6}
                            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                            placeholder="[Event &quot;...&quot;]&#10;[Site &quot;...&quot;]&#10;...&#10;1.e4 e5 2.Nf3..."
                        />
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
                        {editingGame ? 'Güncelle' : 'Ekle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminGamesPage; 