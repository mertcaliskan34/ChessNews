import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile, getUserProfile, checkUserProfileExists, UserProfile } from './users';

// Kayıt ol ve profil oluştur
export const signUpWithProfile = async (
    email: string,
    password: string,
    profileData: { username: string; firstName: string; lastName: string }
): Promise<{ user: User; profile: UserProfile }> => {
    try {
        // Firebase Auth ile kullanıcı oluştur
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firestore'da kullanıcı profili oluştur
        const profile = await createUserProfile(user, profileData);

        return { user, profile };
    } catch (error) {
        console.error('Error signing up with profile:', error);
        throw error;
    }
};

// Giriş yap
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
};

// Çıkış yap
export const logOut = async (): Promise<void> => {
    return signOut(auth);
};

// Auth durumu değişikliklerini dinle
export const onAuthStateChange = (callback: (user: User | null, profile?: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Kullanıcı varsa profilini de getir
            try {
                const profile = await getUserProfile(user.uid);
                callback(user, profile);
            } catch (error) {
                console.error('Error getting user profile:', error);
                callback(user, null);
            }
        } else {
            callback(null, null);
        }
    });
};

// Mevcut kullanıcıyı getir
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

// Kullanıcının profili var mı kontrol et
export const hasUserProfile = async (user: User): Promise<boolean> => {
    return checkUserProfileExists(user.uid);
}; 