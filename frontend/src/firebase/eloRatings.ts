import { collection, addDoc, getDocs, doc, getDoc, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from './config';

export interface EloRating {
    id?: string;
    playerName: string;
    elo: number;
    country?: string;
    title?: string; // GM, IM, FM, etc.
    rank?: number;
    lastUpdated?: Date;
}

// ELO rating ekle (sadece admin için)
export const addEloRating = async (ratingData: Omit<EloRating, 'id' | 'lastUpdated'>) => {
    try {
        const ratingWithTimestamp = {
            ...ratingData,
            lastUpdated: new Date()
        };

        const docRef = await addDoc(collection(db, 'elo_ratings'), ratingWithTimestamp);
        return docRef.id;
    } catch (error) {
        console.error('Error adding ELO rating:', error);
        throw error;
    }
};

// Tüm ELO ratinglerini getir (ELO'ya göre sıralı)
export const getAllEloRatings = async (): Promise<EloRating[]> => {
    try {
        const q = query(collection(db, 'elo_ratings'), orderBy('elo', 'desc'));
        const querySnapshot = await getDocs(q);

        const ratings: EloRating[] = [];
        querySnapshot.forEach((doc, index) => {
            ratings.push({
                id: doc.id,
                rank: index + 1, // Sıralamayı otomatik hesapla
                ...doc.data()
            } as EloRating);
        });

        return ratings;
    } catch (error) {
        console.error('Error getting ELO ratings:', error);
        throw error;
    }
};

// En yüksek N ELO ratingini getir
export const getTopEloRatings = async (count: number = 10): Promise<EloRating[]> => {
    try {
        const q = query(
            collection(db, 'elo_ratings'),
            orderBy('elo', 'desc'),
            // limit(count) // Eğer limit fonksiyonunu import ettiyseniz
        );
        const querySnapshot = await getDocs(q);

        const ratings: EloRating[] = [];
        querySnapshot.forEach((doc, index) => {
            if (index < count) { // Manuel limit
                ratings.push({
                    id: doc.id,
                    rank: index + 1,
                    ...doc.data()
                } as EloRating);
            }
        });

        return ratings;
    } catch (error) {
        console.error('Error getting top ELO ratings:', error);
        throw error;
    }
};

// Belirli bir oyuncunun ELO ratingini getir
export const getPlayerEloRating = async (playerId: string): Promise<EloRating | null> => {
    try {
        const ratingDoc = await getDoc(doc(db, 'elo_ratings', playerId));

        if (ratingDoc.exists()) {
            return {
                id: ratingDoc.id,
                ...ratingDoc.data()
            } as EloRating;
        }
        return null;
    } catch (error) {
        console.error('Error getting player ELO rating:', error);
        throw error;
    }
};

// ELO rating güncelle (sadece admin için)
export const updateEloRating = async (playerId: string, newElo: number) => {
    try {
        const ratingRef = doc(db, 'elo_ratings', playerId);
        await updateDoc(ratingRef, {
            elo: newElo,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Error updating ELO rating:', error);
        throw error;
    }
}; 