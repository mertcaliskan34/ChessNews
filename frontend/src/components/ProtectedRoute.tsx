import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { onAdminAuthStateChange, AdminProfile } from '../firebase/adminAuth';
import { User } from 'firebase/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requiredPermission 
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAdminAuthStateChange((user, adminProfile) => {
            setUser(user);
            setAdminProfile(adminProfile || null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Yükleniyor durumu
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: 2
                }}
            >
                <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
                <Typography variant="h6" sx={{ color: '#D4AF37' }}>
                    Yetkilendirme kontrol ediliyor...
                </Typography>
            </Box>
        );
    }

    // Giriş yapmamış kullanıcıları login sayfasına yönlendir
    if (!user || !adminProfile) {
        return (
            <Navigate 
                to="/admin/login" 
                state={{ 
                    from: location.pathname,
                    message: 'Bu sayfaya erişim için admin girişi gerekli.'
                }} 
                replace 
            />
        );
    }

    // İzin kontrolü (eğer gerekiyorsa)
    if (requiredPermission && !adminProfile.permissions.includes(requiredPermission) && !adminProfile.permissions.includes('*')) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: 2,
                    textAlign: 'center',
                    p: 4
                }}
            >
                <Typography variant="h4" sx={{ color: '#D4AF37', mb: 2 }}>
                    Erişim Reddedildi
                </Typography>
                <Typography variant="h6" sx={{ color: '#8D6E63' }}>
                    Bu işlem için yeterli yetkiniz bulunmuyor.
                </Typography>
                <Typography variant="body1" sx={{ color: '#BCAAA4', mt: 1 }}>
                    Gerekli izin: {requiredPermission}
                </Typography>
            </Box>
        );
    }

    // Admin kullanıcısı ve izinleri uygunsa içeriği göster
    return <>{children}</>;
};

export default ProtectedRoute; 