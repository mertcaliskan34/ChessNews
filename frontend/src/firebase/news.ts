import { collection, addDoc, getDocs, doc, getDoc, orderBy, query, limit, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

export interface NewsArticle {
    id?: string;
    header: string;
    text: string;
    imageUrl?: string;
    badge?: string;
    createdAt?: Date;
    author?: string;
    category?: string;
    updatedAt?: Date;
}

// Haber makalesi ekle (sadece admin için)
export const addNews = async (newsData: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const cleanedData = Object.fromEntries(
            Object.entries(newsData).filter(([, value]) => value !== undefined)
        );
        const now = new Date();
        const newsWithTimestamps = {
            ...cleanedData,
            createdAt: now,
            updatedAt: now
        };
        const docRef = await addDoc(collection(db, 'news'), newsWithTimestamps);
        return docRef.id;
    } catch (error) {
        console.error('Error adding news:', error);
        throw error;
    }
};

// Tüm haberleri getir (en yeniden eskiye)
export const getAllNews = async (limitCount?: number): Promise<NewsArticle[]> => {
    try {
        let q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        if (limitCount) {
            q = query(q, limit(limitCount));
        }
        const querySnapshot = await getDocs(q);
        const news: NewsArticle[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let createdAt: Date | undefined = undefined;
            let updatedAt: Date | undefined = undefined;
            if (data.createdAt) {
                createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            }
            if (data.updatedAt) {
                updatedAt = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
            }
            news.push({
                id: docSnap.id,
                ...data,
                createdAt,
                updatedAt
            } as NewsArticle);
        });
        return news;
    } catch (error) {
        console.error('Error getting news:', error);
        throw error;
    }
};

// Belirli bir haberi getir
export const getNews = async (newsId: string): Promise<NewsArticle | null> => {
    try {
        const newsDoc = await getDoc(doc(db, 'news', newsId));
        if (newsDoc.exists()) {
            const data = newsDoc.data();
            let createdAt: Date | undefined = undefined;
            let updatedAt: Date | undefined = undefined;
            if (data.createdAt) {
                createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            }
            if (data.updatedAt) {
                updatedAt = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
            }
            return {
                id: newsDoc.id,
                ...data,
                createdAt,
                updatedAt
            } as NewsArticle;
        }
        return null;
    } catch (error) {
        console.error('Error getting news:', error);
        throw error;
    }
};

// Son N adet haberi getir (ana sayfa için)
export const getLatestNews = async (count: number = 5): Promise<NewsArticle[]> => {
    return getAllNews(count);
};

// Update news
export const updateNews = async (id: string, newsData: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const newsDoc = await getDoc(doc(db, 'news', id));
        let createdAt = new Date();
        if (newsDoc.exists()) {
            const data = newsDoc.data();
            if (data.createdAt) {
                createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            }
        }
        const cleanedData = Object.fromEntries(
            Object.entries(newsData).filter(([, value]) => value !== undefined)
        );
        await setDoc(doc(db, 'news', id), { ...cleanedData, createdAt, updatedAt: new Date() }, { merge: true });
    } catch (error) {
        console.error('Error updating news:', error);
        throw error;
    }
};

// Delete news
export const deleteNews = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'news', id));
    } catch (error) {
        console.error('Error deleting news:', error);
        throw error;
    }
}; 