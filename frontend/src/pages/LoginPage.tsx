import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Link
} from '@mui/material';
import { LoginOutlined, PersonAddOutlined } from '@mui/icons-material';
import { signUpWithProfile, signIn, onAuthStateChange } from '../firebase/auth';
import { User } from 'firebase/auth';
import { UserProfile } from '../firebase/users';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form alanları
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user, profile) => {
            setUser(user);
            setUserProfile(profile || null);

            // Eğer kullanıcı giriş yapmışsa ana sayfaya yönlendir
            if (user && profile) {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signIn(email, password);
            // Navigation will be handled by useEffect
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor');
            setLoading(false);
            return;
        }

        try {
            await signUpWithProfile(email, password, {
                username,
                firstName,
                lastName
            });
            // Navigation will be handled by useEffect
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError('');
        // Form alanlarını temizle
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setFirstName('');
        setLastName('');
    };

    return (
        <Container
            maxWidth="sm"
            sx={{
                mt: 8,
                mb: 8,
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    p: 4,
                    width: '100%',
                    background: 'linear-gradient(135deg, #2C1810 0%, #3E2723 100%)',
                    color: 'white',
                    borderRadius: 3
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: 'Playfair Display, serif',
                            fontWeight: 700,
                            mb: 1,
                            color: '#D4AF37'
                        }}
                    >
                        {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#BCAAA4' }}>
                        {isSignUp ? 'ChessNews ailesine katılın' : 'Hesabınıza giriş yapın'}
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                    {isSignUp && (
                        <>
                            <TextField
                                fullWidth
                                label="Kullanıcı Adı"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                sx={{ mb: 2 }}
                                InputLabelProps={{ style: { color: '#BCAAA4' } }}
                                InputProps={{
                                    style: { color: 'white' },
                                    sx: {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#5D4037'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#D4AF37'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#D4AF37'
                                        }
                                    }
                                }}
                            />

                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Ad"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    InputLabelProps={{ style: { color: '#BCAAA4' } }}
                                    InputProps={{
                                        style: { color: 'white' },
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#5D4037'
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#D4AF37'
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#D4AF37'
                                            }
                                        }
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Soyad"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    InputLabelProps={{ style: { color: '#BCAAA4' } }}
                                    InputProps={{
                                        style: { color: 'white' },
                                        sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#5D4037'
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#D4AF37'
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#D4AF37'
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </>
                    )}

                    <TextField
                        fullWidth
                        type="email"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        InputLabelProps={{ style: { color: '#BCAAA4' } }}
                        InputProps={{
                            style: { color: 'white' },
                            sx: {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#5D4037'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#D4AF37'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#D4AF37'
                                }
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        type="password"
                        label="Şifre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        sx={{ mb: isSignUp ? 2 : 3 }}
                        InputLabelProps={{ style: { color: '#BCAAA4' } }}
                        InputProps={{
                            style: { color: 'white' },
                            sx: {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#5D4037'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#D4AF37'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#D4AF37'
                                }
                            }
                        }}
                    />

                    {isSignUp && (
                        <TextField
                            fullWidth
                            type="password"
                            label="Şifre Tekrar"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            sx={{ mb: 3 }}
                            InputLabelProps={{ style: { color: '#BCAAA4' } }}
                            InputProps={{
                                style: { color: 'white' },
                                sx: {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#5D4037'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#D4AF37'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#D4AF37'
                                    }
                                }
                            }}
                        />
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : (isSignUp ? <PersonAddOutlined /> : <LoginOutlined />)}
                        sx={{
                            py: 1.5,
                            mb: 2,
                            backgroundColor: '#D4AF37',
                            color: '#2C1810',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            '&:hover': {
                                backgroundColor: '#B8941F'
                            },
                            '&:disabled': {
                                backgroundColor: '#5D4037',
                                color: '#BCAAA4'
                            }
                        }}
                    >
                        {loading ? 'Yükleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
                    </Button>

                    <Divider sx={{ my: 2, borderColor: '#5D4037' }} />

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#BCAAA4', mb: 1 }}>
                            {isSignUp ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}
                        </Typography>
                        <Link
                            component="button"
                            type="button"
                            onClick={toggleMode}
                            sx={{
                                color: '#D4AF37',
                                textDecoration: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                    textDecoration: 'underline'
                                }
                            }}
                        >
                            {isSignUp ? 'Giriş Yap' : 'Kayıt Ol'}
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage; 