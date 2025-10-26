import { collection, addDoc, getDocs, doc, getDoc, orderBy, query, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

export interface ClassicGame {
    id?: string;
    title: string;
    pgn: string;
    year?: number;
    whitePlayer?: string;
    blackPlayer?: string;
    event?: string;
    createdAt?: Date;
}

// Klasik oyun ekle (sadece admin için)
export const addClassicGame = async (gameData: Omit<ClassicGame, 'id' | 'createdAt'>) => {
    try {
        const gameWithTimestamp = {
            ...gameData,
            createdAt: new Date()
        };

        const docRef = await addDoc(collection(db, 'classic_games'), gameWithTimestamp);
        return docRef.id;
    } catch (error) {
        console.error('Error adding classic game:', error);
        throw error;
    }
};

// Tüm klasik oyunları getir
export const getAllClassicGames = async (): Promise<ClassicGame[]> => {
    try {
        const q = query(collection(db, 'classic_games'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const games: ClassicGame[] = [];
        querySnapshot.forEach((doc) => {
            games.push({
                id: doc.id,
                ...doc.data()
            } as ClassicGame);
        });

        return games;
    } catch (error) {
        console.error('Error getting classic games:', error);
        throw error;
    }
};

// Belirli bir klasik oyunu getir
export const getClassicGame = async (gameId: string): Promise<ClassicGame | null> => {
    try {
        const gameDoc = await getDoc(doc(db, 'classic_games', gameId));

        if (gameDoc.exists()) {
            return {
                id: gameDoc.id,
                ...gameDoc.data()
            } as ClassicGame;
        }
        return null;
    } catch (error) {
        console.error('Error getting classic game:', error);
        throw error;
    }
};

// Klasik oyun güncelle
export const updateClassicGame = async (id: string, gameData: Omit<ClassicGame, 'id' | 'createdAt'>) => {
    try {
        const gameWithTimestamp = {
            ...gameData,
            updatedAt: new Date()
        };

        await setDoc(doc(db, 'classic_games', id), gameWithTimestamp, { merge: true });
    } catch (error) {
        console.error('Error updating classic game:', error);
        throw error;
    }
};

// Klasik oyun sil
export const deleteClassicGame = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'classic_games', id));
    } catch (error) {
        console.error('Error deleting classic game:', error);
        throw error;
    }
}; 