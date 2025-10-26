import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    Chip,
    Alert
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Article as NewsIcon,
    SportsEsports as GamesIcon,
    TrendingUp as EloIcon,
    ExitToApp as LogoutIcon,
    Person as PersonIcon,
    Add as AddIcon,
    Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminSignOut, getCurrentAdmin, AdminProfile, ADMIN_PERMISSIONS, hasAdminPermission } from '../firebase/adminAuth';
import { getAllNews } from '../firebase/news';
import { getAllClassicGames } from '../firebase/classicGames';

interface DashboardStats {
    totalNews: number;
    totalGames: number;
    totalEloRatings: number;
    recentActivity: string;
}

const AdminDashboard: React.FC = () => {
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalNews: 0,
        totalGames: 0,
        totalEloRatings: 0,
        recentActivity: 'Yükleniyor...'
    });
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        try {
            const admin = await getCurrentAdmin();
            setAdminProfile(admin);

            if (admin) {
                // İstatistikleri yükle
                const [newsData, gamesData] = await Promise.all([
                    getAllNews().catch(() => []),
                    getAllClassicGames().catch(() => [])
                ]);

                // ELO verilerini backend API'sinden al
                let eloCount = 0;
                try {
                    const response = await fetch('/api/elo');
                    if (response.ok) {
                        const eloData = await response.json();
                        eloCount = eloData.length;
                    }
                } catch (error) {
                    console.error('Error fetching ELO data from backend:', error);
                }

                setStats({
                    totalNews: newsData.length,
                    totalGames: gamesData.length,
                    totalEloRatings: eloCount,
                    recentActivity: `Son güncelleme: ${new Date().toLocaleDateString('tr-TR')}`
                });
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await adminSignOut();
            navigate('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleNavigateToModule = (path: string) => {
        navigate(path);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography>Yükleniyor...</Typography>
            </Box>
        );
    }

    if (!adminProfile) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">
                    Admin profili yüklenemedi. Lütfen tekrar giriş yapın.
                </Alert>
            </Box>
        );
    }

    const dashboardModules = [
        {
            title: 'Haber Yönetimi',
            description: 'Haber oluştur, düzenle ve yönet',
            icon: NewsIcon,
            color: '#FF9800',
            path: '/admin/news',
            permission: ADMIN_PERMISSIONS.NEWS_READ,
            stats: `${stats.totalNews} haber`
        },
        {
            title: 'Klasik Oyun Yönetimi',
            description: 'Klasik satranç oyunlarını yönet',
            icon: GamesIcon,
            color: '#4CAF50',
            path: '/admin/games',
            permission: ADMIN_PERMISSIONS.GAMES_READ,
            stats: `${stats.totalGames} oyun`
        },
        {
            title: 'Veri Giriş Aracı',
            description: 'Manuel veri girişi için form aracı',
            icon: AddIcon,
            color: '#9C27B0',
            path: '/admin/data-populator',
            permission: ADMIN_PERMISSIONS.ALL,
            stats: 'Hızlı giriş'
        }
    ];

    return (
        <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Admin Navbar */}
            <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)' }}>
                <Toolbar>
                    <DashboardIcon sx={{ mr: 2, color: '#D4AF37' }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#D4AF37' }}>
                        Admin Panel - ChessNews
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            icon={<PersonIcon />}
                            label={adminProfile.displayName}
                            variant="outlined"
                            sx={{ 
                                color: '#D4AF37', 
                                borderColor: '#D4AF37',
                                '& .MuiChip-icon': { color: '#D4AF37' }
                            }}
                        />
                        
                        <IconButton onClick={handleMenuOpen} sx={{ color: '#D4AF37' }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#D4AF37', color: '#3E2723' }}>
                                {adminProfile.displayName.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                        
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={handleMenuClose}>
                                <PersonIcon sx={{ mr: 1 }} />
                                {adminProfile.email}
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <LogoutIcon sx={{ mr: 1 }} />
                                Çıkış Yap
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* Welcome Section */}
                <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)' }}>
                    <Typography variant="h4" sx={{ color: '#3E2723', fontWeight: 'bold', mb: 2 }}>
                        Hoş geldiniz, {adminProfile.displayName}!
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#5D4037' }}>
                        ChessNews Admin Paneli
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#3E2723', mt: 1 }}>
                        {stats.recentActivity}
                    </Typography>
                </Paper>

                {/* Stats Cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 3,
                        mb: 4,
                        width: '100%',
                        alignItems: 'stretch',
                    }}
                >
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <NewsIcon sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                                {stats.totalNews}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Toplam Haber
                            </Typography>
                        </CardContent>
                    </Card>
                    
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <GamesIcon sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                                {stats.totalGames}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Klasik Oyun
                            </Typography>
                        </CardContent>
                    </Card>
                    
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <AnalyticsIcon sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                                {adminProfile.permissions.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                İzin Seviyesi
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Module Cards */}
                <Typography variant="h5" sx={{ mb: 3, color: '#3E2723', fontWeight: 'bold' }}>
                    Yönetim Modülleri
                </Typography>
                
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(3, 1fr)' },
                    gap: 3 
                }}>
                    {dashboardModules.map((module) => {
                        const hasPermission = hasAdminPermission(adminProfile, module.permission);
                        
                        return (
                            <Card 
                                key={module.title}
                                sx={{
                                    height: '100%',
                                    cursor: hasPermission ? 'pointer' : 'not-allowed',
                                    opacity: hasPermission ? 1 : 0.6,
                                    transition: 'all 0.3s ease',
                                    '&:hover': hasPermission ? {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    } : {}
                                }}
                                onClick={() => hasPermission && handleNavigateToModule(module.path)}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <module.icon sx={{ fontSize: 32, color: module.color, mr: 2 }} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3E2723' }}>
                                                {module.title}
                                            </Typography>
                                            <Chip 
                                                label={module.stats}
                                                size="small"
                                                sx={{ 
                                                    bgcolor: module.color,
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                    
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        {module.description}
                                    </Typography>
                                    
                                    <Button
                                        variant="contained"
                                        disabled={!hasPermission}
                                        sx={{
                                            background: `linear-gradient(135deg, ${module.color}dd 0%, ${module.color} 100%)`,
                                            color: 'white',
                                            '&:hover': {
                                                background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}aa 100%)`,
                                            }
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (hasPermission) {
                                                handleNavigateToModule(module.path);
                                            }
                                        }}
                                    >
                                        {hasPermission ? 'Yönet' : 'Erişim Yok'}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>

                {/* Quick Actions */}
                <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#3E2723', fontWeight: 'bold' }}>
                        Hızlı Erişim
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => navigate('/')}
                            sx={{ color: '#3E2723', borderColor: '#3E2723' }}
                        >
                            Ana Siteyi Görüntüle
                        </Button>
                        <Button 
                            variant="outlined"
                            onClick={() => handleNavigateToModule('/admin/data-populator')}
                            sx={{ color: '#D4AF37', borderColor: '#D4AF37' }}
                        >
                            Hızlı Veri Girişi
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminDashboard; 