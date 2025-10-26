import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    InputAdornment,
    Chip,
    Avatar,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Stack
} from '@mui/material';
import {
    Search as SearchIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as TrophyIcon,
    Public as GlobalIcon
} from '@mui/icons-material';
import { getAllEloRatings, EloRating } from '../firebase/eloRatings';

const EloPage: React.FC = () => {
    const [eloRatings, setEloRatings] = useState<EloRating[]>([]);
    const [filteredRatings, setFilteredRatings] = useState<EloRating[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [titleFilter, setTitleFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');

    useEffect(() => {
        fetchEloRatings();
    }, []);

    useEffect(() => {
        filterRatings();
    }, [eloRatings, searchTerm, titleFilter, countryFilter]);

    const fetchEloRatings = async () => {
        try {
            setLoading(true);
            const ratings = await getAllEloRatings();
            console.log('Fetched ratings:', ratings); // Debug log
            // Sort by ELO rating (highest first) and then by rank if available
            const sortedRatings = ratings.sort((a, b) => {
                if (a.rank && b.rank) {
                    return a.rank - b.rank;
                }
                return b.elo - a.elo;
            });
            setEloRatings(sortedRatings);
        } catch (err: unknown) {
            console.error('Error fetching ELO ratings:', err); // Debug log
            setError('ELO puanları yüklenirken hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const filterRatings = () => {
        let filtered = eloRatings.filter(rating =>
            rating.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (rating.country && rating.country.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (titleFilter) {
            filtered = filtered.filter(rating => rating.title === titleFilter);
        }

        if (countryFilter) {
            filtered = filtered.filter(rating => rating.country === countryFilter);
        }

        setFilteredRatings(filtered);
    };

    const getCountryFlag = (country: string) => {
        const countryFlags: { [key: string]: string } = {
            'Norway': '🇳🇴',
            'USA': '🇺🇸',
            'China': '🇨🇳',
            'Russia': '🇷🇺',
            'India': '🇮🇳',
            'France': '🇫🇷',
            'Netherlands': '🇳🇱',
            'Azerbaijan': '🇦🇿',
            'Turkey': '🇹🇷',
            'Türkiye': '🇹🇷',
        };
        return countryFlags[country] || '🌍';
    };

    const getTitleColor = (title?: string) => {
        const colors: { [key: string]: string } = {
            'GM': '#D4AF37', // Gold
            'IM': '#C0C0C0', // Silver
            'FM': '#CD7F32', // Bronze
            'CM': '#4CAF50', // Green
            'WGM': '#E91E63', // Pink
            'WIM': '#9C27B0', // Purple
            'WFM': '#FF9800', // Orange
            'WCM': '#795548', // Brown
        };
        return colors[title || ''] || '#757575';
    };

    const uniqueTitles = [...new Set(eloRatings.map(r => r.title).filter(Boolean))];
    const uniqueCountries = [...new Set(eloRatings.map(r => r.country).filter(Boolean))];

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
            </Container>
        );
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
            py: 4
        }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            color: '#D4AF37',
                            fontFamily: 'Playfair Display, serif',
                            fontWeight: 700,
                            mb: 2
                        }}
                    >
                        🏆 ELO Sıralaması
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ color: '#BCAAA4', mb: 4 }}
                    >
                        Dünya Satranç Oyuncuları ELO Puanları
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Top 3 Highlights */}
                {filteredRatings.length >= 3 && !searchTerm && !titleFilter && !countryFilter && (
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
                        {filteredRatings.slice(0, 3).map((player, index) => (
                            <Box key={player.id || index} sx={{ flex: 1 }}>
                                <Card
                                    elevation={6}
                                    sx={{
                                        background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)' :
                                            index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #9E9E9E 100%)' :
                                                'linear-gradient(135deg, #CD7F32 0%, #8D6E63 100%)',
                                        color: '#2C1810',
                                        textAlign: 'center'
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h4" sx={{ mb: 1 }}>
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                            {player.playerName}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                            {player.elo}
                                        </Typography>
                                        <Typography variant="body2">
                                            {getCountryFlag(player.country || '')} {player.country || 'Unknown'}
                                        </Typography>
                                        {player.title && (
                                            <Chip
                                                label={player.title}
                                                size="small"
                                                sx={{
                                                    mt: 1,
                                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                                    color: '#2C1810',
                                                    fontWeight: 600
                                                }}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </Box>
                        ))}
                    </Stack>
                )}

                {/* Filters */}
                <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField
                            fullWidth
                            placeholder="Oyuncu veya ülke ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#D4AF37' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                }
                            }}
                        />
                        <FormControl fullWidth sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                            <InputLabel>Unvan Filtresi</InputLabel>
                            <Select
                                value={titleFilter}
                                onChange={(e) => setTitleFilter(e.target.value)}
                                label="Unvan Filtresi"
                            >
                                <MenuItem value="">Tümü</MenuItem>
                                {uniqueTitles.map(title => (
                                    <MenuItem key={title} value={title}>{title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                            <InputLabel>Ülke Filtresi</InputLabel>
                            <Select
                                value={countryFilter}
                                onChange={(e) => setCountryFilter(e.target.value)}
                                label="Ülke Filtresi"
                            >
                                <MenuItem value="">Tümü</MenuItem>
                                {uniqueCountries.map(country => (
                                    <MenuItem key={country} value={country || ''}>
                                        {getCountryFlag(country || '')} {country}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Paper>

                {/* ELO Table */}
                <TableContainer component={Paper} elevation={6}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#3E2723' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Sıra</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Oyuncu</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>ELO</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Ülke</TableCell>
                                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Unvan</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRatings.map((player, index) => (
                                <TableRow
                                    key={player.id || index}
                                    sx={{
                                        '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                        '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.1)' }
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {player.rank || (index + 1)}
                                            {index < 3 && !searchTerm && !titleFilter && !countryFilter && (
                                                <Box sx={{ ml: 1 }}>
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                                </Box>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{
                                                bgcolor: getTitleColor(player.title),
                                                width: 32,
                                                height: 32,
                                                mr: 2,
                                                fontSize: '0.8rem'
                                            }}>
                                                {player.playerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {player.playerName}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 700,
                                            color: player.elo >= 2700 ? '#D4AF37' :
                                                player.elo >= 2600 ? '#4CAF50' :
                                                    '#1976D2'
                                        }}>
                                            {player.elo}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>
                                                {getCountryFlag(player.country || '')}
                                            </span>
                                            {player.country || 'Unknown'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {player.title ? (
                                            <Chip
                                                label={player.title}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getTitleColor(player.title),
                                                    color: 'white',
                                                    fontWeight: 600
                                                }}
                                            />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredRatings.length === 0 && !loading && (
                    <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
                        <Typography variant="h6" color="text.secondary">
                            {eloRatings.length === 0 ?
                                'Henüz hiç ELO puanı eklenmemiş. Veri giriş sayfasından oyuncu ekleyebilirsiniz.' :
                                'Hiç oyuncu bulunamadı'
                            }
                        </Typography>
                    </Paper>
                )}

                {/* Stats Footer */}
                <Paper elevation={3} sx={{ p: 3, mt: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} textAlign="center">
                        <Box sx={{ flex: 1 }}>
                            <TrendingUpIcon sx={{ color: '#D4AF37', fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 600 }}>
                                {filteredRatings.length}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#BCAAA4' }}>
                                Toplam Oyuncu
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <TrophyIcon sx={{ color: '#D4AF37', fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 600 }}>
                                {filteredRatings.filter(p => p.elo >= 2700).length}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#BCAAA4' }}>
                                2700+ ELO
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <GlobalIcon sx={{ color: '#D4AF37', fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 600 }}>
                                {uniqueCountries.length}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#BCAAA4' }}>
                                Farklı Ülke
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default EloPage; 