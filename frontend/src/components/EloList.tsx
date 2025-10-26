import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, InputAdornment,
    Chip, Avatar, CircularProgress, Alert, Card, CardContent,
    MenuItem, FormControl, InputLabel, Select, Stack, Pagination
} from '@mui/material';
import {
    Search as SearchIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as TrophyIcon,
    Public as GlobalIcon
} from '@mui/icons-material';

// EloList'in kullandığı veri yapısı
interface EloEntry {
    id: string;
    title: string | null;
    name: string;
    rating: number;
    games: number;
    birthYear: number;
    // NOT: Veri kaynağınızda ülke bilgisi varsa bu satırı ekleyebilirsiniz.
    // country?: string; 
}

// Tasarımdan alınan yardımcı fonksiyonlar
const getCountryFlag = (country: string) => {
    const countryFlags: { [key: string]: string } = { 'Norway': '🇳🇴', 'USA': '🇺🇸', 'China': '🇨🇳', 'Russia': '🇷🇺', 'India': '🇮🇳', 'France': '🇫🇷', 'Netherlands': '🇳🇱', 'Azerbaijan': '🇦🇿', 'Turkey': '🇹🇷', 'Türkiye': '🇹🇷' };
    return countryFlags[country] || '🌍';
};

const getTitleColor = (title?: string | null) => {
    const colors: { [key: string]: string } = { 'GM': '#D4AF37', 'IM': '#C0C0C0', 'FM': '#CD7F32', 'CM': '#4CAF50', 'WGM': '#E91E63', 'WIM': '#9C27B0', 'WFM': '#FF9800', 'WCM': '#795548' };
    return colors[title || ''] || '#757575';
};

const EloList: React.FC = () => {
    const [allRatings, setAllRatings] = useState<EloEntry[]>([]);
    const [filteredRatings, setFilteredRatings] = useState<EloEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [titleFilter, setTitleFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const fetchEloData = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/elo'); // Veri kaynağınız
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                let data: EloEntry[] = await response.json();
                data.sort((a, b) => b.rating - a.rating);

                setAllRatings(data);
                setFilteredRatings(data); // Başlangıçta hepsi görünsün
                setError('');
            } catch (e: any) {
                setError(e.message || 'Failed to fetch ELO data');
                console.error("Fetching ELO data failed:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchEloData();
    }, []);

    useEffect(() => {
        let filtered = allRatings.filter(player =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (titleFilter) {
            filtered = filtered.filter(player => player.title === titleFilter);
        }

        setFilteredRatings(filtered);
        setCurrentPage(1); // Filtre değişince ilk sayfaya dön
    }, [searchTerm, titleFilter, allRatings]);

    // Pagination hesaplamaları
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedRatings = filteredRatings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
        window.scrollTo(0, 0);
    };

    const uniqueTitles = [...new Set(allRatings.map(r => r.title).filter(Boolean))];

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
            </Container>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)', py: 4 }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h3" sx={{ color: '#D4AF37', fontFamily: 'Playfair Display, serif', fontWeight: 700, mb: 2 }}>
                        🏆 ELO Sıralaması
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#BCAAA4', mb: 4 }}>
                        Türkiye Satranç Oyuncuları ELO Puanları
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {filteredRatings.length >= 3 && currentPage === 1 && !searchTerm && !titleFilter && (
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
                        {filteredRatings.slice(0, 3).map((player, index) => (
                            <Box key={player.id} sx={{ flex: 1 }}>
                                <Card elevation={6} sx={{ background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)' : index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #9E9E9E 100%)' : 'linear-gradient(135deg, #CD7F32 0%, #8D6E63 100%)', color: '#2C1810', textAlign: 'center' }}>
                                    <CardContent>
                                        <Typography variant="h4" sx={{ mb: 1 }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{player.name}</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{player.rating}</Typography>
                                        {player.title && <Chip label={player.title} size="small" sx={{ mt: 1, backgroundColor: 'rgba(255,255,255,0.3)', color: '#2C1810', fontWeight: 600 }} />}
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Stack>
                )}
                
                <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField fullWidth placeholder="Oyuncu ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#D4AF37' }} /></InputAdornment>), }} sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.9)', } }}/>
                        <FormControl fullWidth sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                            <InputLabel>Unvan Filtresi</InputLabel>
                            <Select value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)} label="Unvan Filtresi">
                                <MenuItem value="">Tümü</MenuItem>
                                {uniqueTitles.map(title => (<MenuItem key={title} value={title || ''}>{title}</MenuItem>))}
                            </Select>
                        </FormControl>
                        {/* NOT: Veri kaynağınıza ülke eklediğinizde bu filtreyi de açabilirsiniz. */}
                    </Stack>
                </Paper>

                <TableContainer component={Paper} elevation={6}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#3E2723' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Sıra</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Oyuncu</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>ELO</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Unvan</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>FIDE ID</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedRatings.map((player, index) => (
                                <TableRow key={player.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }, '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.1)' } }}>
                                    <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: getTitleColor(player.title), width: 32, height: 32, mr: 2, fontSize: '0.8rem' }}>{player.name.split(' ').map(n => n[0]).join('').toUpperCase()}</Avatar>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{player.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: player.rating >= 2600 ? '#D4AF37' : player.rating >= 2400 ? '#4CAF50' : '#1976D2' }}>{player.rating}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {player.title ? (<Chip label={player.title} size="small" sx={{ backgroundColor: getTitleColor(player.title), color: 'white', fontWeight: 600 }} />) : (<Typography variant="body2" color="text.secondary">-</Typography>)}
                                    </TableCell>
                                    <TableCell>
                                        <a href={`https://ratings.fide.com/profile/${player.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                          {player.id}
                                        </a>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, mt: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
                        <Pagination
                            count={totalPages} page={currentPage} onChange={handlePageChange} color="primary"
                            sx={{ '& .MuiPaginationItem-root': { color: '#D4AF37' }, '& .Mui-selected': { backgroundColor: 'rgba(212, 175, 55, 0.3) !important' } }}
                        />
                    </Box>
                )}

                {filteredRatings.length === 0 && !loading && (
                    <Paper sx={{ p: 4, textAlign: 'center', mt: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Typography variant="h6" color="#BCAAA4">Filtre kriterlerine uygun oyuncu bulunamadı.</Typography>
                    </Paper>
                )}

                <Paper elevation={3} sx={{ p: 3, mt: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                   <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} textAlign="center">
                        <Box sx={{ flex: 1 }}>
                            <TrendingUpIcon sx={{ color: '#D4AF37', fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 600 }}>{filteredRatings.length}</Typography>
                            <Typography variant="body2" sx={{ color: '#BCAAA4' }}>Listelenen Oyuncu</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TrophyIcon sx={{ color: '#D4AF37', fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 600 }}>{filteredRatings.filter(p => p.rating >= 2600).length}</Typography>
                            <Typography variant="body2" sx={{ color: '#BCAAA4' }}>2600+ ELO</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <GlobalIcon sx={{ color: '#D4AF37', fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 600 }}>{uniqueTitles.length}</Typography>
                            <Typography variant="body2" sx={{ color: '#BCAAA4' }}>Farklı Unvan</Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default EloList;