import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface AdminProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'admin';
    permissions: string[];
    createdAt: Date;
    isActive: boolean;
}

// Admin giriş yapar
export const adminSignIn = async (email: string, password: string): Promise<{ user: User; adminProfile: AdminProfile }> => {
    try {
        // Firebase Auth ile giriş yap
        const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Admin profilini kontrol et
        const adminProfile = await getAdminProfile(user.uid);
        
        if (!adminProfile) {
            // Eğer admin değilse, çıkış yap ve hata fırlat
            await signOut(auth);
            throw new Error('Bu hesap admin erişimi için yetkilendirilmemiş.');
        }
        
        if (!adminProfile.isActive) {
            await signOut(auth);
            throw new Error('Admin hesabınız devre dışı bırakılmış.');
        }
        
        return { user, adminProfile };
    } catch (error: unknown) {
        console.error('Admin login error:', error);
        throw error;
    }
};

// Admin çıkış yapar
export const adminSignOut = async (): Promise<void> => {
    return signOut(auth);
};

// Admin profilini getir
export const getAdminProfile = async (uid: string): Promise<AdminProfile | null> => {
    try {
        const adminDoc = await getDoc(doc(db, 'admins', uid));
        
        if (adminDoc.exists()) {
            const data = adminDoc.data();
            return {
                uid,
                email: data.email,
                displayName: data.displayName,
                role: data.role,
                permissions: data.permissions || [],
                createdAt: data.createdAt?.toDate() || new Date(),
                isActive: data.isActive !== false // Default to true if not specified
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting admin profile:', error);
        return null;
    }
};

// Mevcut kullanıcının admin olup olmadığını kontrol et
export const getCurrentAdmin = async (): Promise<AdminProfile | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await getAdminProfile(user.uid);
};

// Admin durumu değişikliklerini dinle
export const onAdminAuthStateChange = (callback: (user: User | null, adminProfile?: AdminProfile | null) => void) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const adminProfile = await getAdminProfile(user.uid);
                if (adminProfile && adminProfile.isActive) {
                    callback(user, adminProfile);
                } else {
                    // Admin değilse veya deaktifse çıkış yap
                    await signOut(auth);
                    callback(null, null);
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                await signOut(auth);
                callback(null, null);
            }
        } else {
            callback(null, null);
        }
    });
};

// Admin izinlerini kontrol et
export const hasAdminPermission = (adminProfile: AdminProfile | null, permission: string): boolean => {
    if (!adminProfile || !adminProfile.isActive) return false;
    return adminProfile.permissions.includes(permission) || adminProfile.permissions.includes('*');
};

// Tüm izinler listesi
export const ADMIN_PERMISSIONS = {
    NEWS_CREATE: 'news:create',
    NEWS_READ: 'news:read',
    NEWS_UPDATE: 'news:update',
    NEWS_DELETE: 'news:delete',
    GAMES_CREATE: 'games:create',
    GAMES_READ: 'games:read',
    GAMES_UPDATE: 'games:update',
    GAMES_DELETE: 'games:delete',
    ELO_CREATE: 'elo:create',
    ELO_READ: 'elo:read',
    ELO_UPDATE: 'elo:update',
    ELO_DELETE: 'elo:delete',
    ADMIN_MANAGE: 'admin:manage',
    ALL: '*'
} as const; 