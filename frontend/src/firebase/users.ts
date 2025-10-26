import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import { User } from 'firebase/auth';

export interface UserProfile {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt?: Date;
}

// Kullanıcı profili oluştur (Firebase Auth UID'yi document ID olarak kullan)
export const createUserProfile = async (user: User, profileData: Omit<UserProfile, 'email' | 'createdAt'>) => {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userData: UserProfile = {
            ...profileData,
            email: user.email || '',
            createdAt: new Date()
        };

        await setDoc(userDocRef, userData);
        return userData;
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
};

// Kullanıcı profilini getir
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return userDoc.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

// Kullanıcı profilini güncelle
export const updateUserProfile = async (uid: string, updateData: Partial<UserProfile>) => {
    try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, updateData);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

// Kullanıcı profili var mı kontrol et
export const checkUserProfileExists = async (uid: string): Promise<boolean> => {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        return userDoc.exists();
    } catch (error) {
        console.error('Error checking user profile:', error);
        return false;
    }
}; 