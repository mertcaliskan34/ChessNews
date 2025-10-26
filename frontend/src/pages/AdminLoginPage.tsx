import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Container,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    AdminPanelSettings as AdminIcon,
    Lock as LockIcon,
    Email as EmailIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { adminSignIn, onAdminAuthStateChange, AdminProfile } from '../firebase/adminAuth';
import { User } from 'firebase/auth';

interface LocationState {
    from?: string;
    message?: string;
}

const AdminLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    
    const location = useLocation();
    const navigate = useNavigate();

    // Location state'den gelen bilgiler
    const locationState = location.state as LocationState | null;
    const from = locationState?.from || '/admin/dashboard';

    useEffect(() => {
        const unsubscribe = onAdminAuthStateChange((user, adminProfile) => {
            setUser(user);
            setAdminProfile(adminProfile || null);
            setCheckingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    // Eğer zaten giriş yapmışsa admin paneline yönlendir
    if (checkingAuth) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh'
                }}
            >
                <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
            </Box>
        );
    }

    if (user && adminProfile) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await adminSignIn(email, password);
            // Auth state değişecek ve otomatik olarak yönlendirilecek
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Giriş yaparken bir hata oluştu.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #2C1810 0%, #3E2723 30%, #5D4037 70%, #8D6E63 100%)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23D4AF37" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    opacity: 0.3,
                    pointerEvents: 'none'
                }
            }}
        >
            {/* Back Button */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    zIndex: 10
                }}
            >
                <IconButton
                    onClick={handleGoBack}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#FAFAFA',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        '&:hover': {
                            backgroundColor: 'rgba(212, 175, 55, 0.2)',
                            color: '#FFD700',
                            transform: 'translateX(-2px)',
                        },
                        transition: 'all 0.3s ease',
                        width: 48,
                        height: 48
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
            </Box>

            <Container maxWidth="sm" sx={{ py: 8, zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper
                    elevation={24}
                    sx={{
                        p: 4,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 220, 0.98) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '16px',
                        boxShadow: '0 24px 48px rgba(61, 39, 35, 0.2), 0 8px 16px rgba(212, 175, 55, 0.1)',
                        maxWidth: 400,
                        width: '100%'
                    }}
                >
                    {/* İkon ve Başlık */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                mb: 2,
                                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)'
                            }}
                        >
                            <AdminIcon sx={{ fontSize: 40, color: '#2C1810' }} />
                        </Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: '#2C1810',
                                mb: 1,
                                fontFamily: 'Playfair Display'
                            }}
                        >
                            Yetkili Girişi
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#8D6E63',
                                fontSize: '0.9rem'
                            }}
                        >
                            Bu panel sadece yetkililer için tasarlanmıştır.
                        </Typography>
                    </Box>

                    {/* Hata Mesajı */}
                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: '12px',
                                '& .MuiAlert-message': {
                                    fontSize: '0.9rem'
                                }
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Giriş Formu */}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Email adresinizi girin"
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    '& fieldset': {
                                        borderColor: 'rgba(212, 175, 55, 0.3)',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(212, 175, 55, 0.5)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#D4AF37',
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon sx={{ color: '#8D6E63' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Şifrenizi girin"
                            sx={{
                                mb: 4,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    '& fieldset': {
                                        borderColor: 'rgba(212, 175, 55, 0.3)',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(212, 175, 55, 0.5)',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#D4AF37',
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: '#8D6E63' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleTogglePasswordVisibility}
                                            edge="end"
                                            sx={{ 
                                                mr: 0.5,
                                                color: '#FFFFFF'
                                            }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                                color: '#2C1810',
                                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #B8941F 0%, #E6C200 100%)',
                                    boxShadow: '0 12px 32px rgba(212, 175, 55, 0.4)',
                                    transform: 'translateY(-2px)',
                                },
                                '&:disabled': {
                                    background: 'rgba(212, 175, 55, 0.3)',
                                    color: 'rgba(44, 24, 16, 0.5)',
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: '#2C1810' }} />
                            ) : (
                                'Giriş'
                            )}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminLoginPage; 