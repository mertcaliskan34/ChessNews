import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    DocumentData,
    QuerySnapshot,
    DocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Add a document to a collection
export const addDocument = async (collectionName: string, data: any) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef.id;
    } catch (error) {
        console.error('Error adding document: ', error);
        throw error;
    }
};

// Get a single document by ID
export const getDocument = async (collectionName: string, docId: string): Promise<DocumentSnapshot<DocumentData>> => {
    try {
        const docRef = doc(db, collectionName, docId);
        return await getDoc(docRef);
    } catch (error) {
        console.error('Error getting document: ', error);
        throw error;
    }
};

// Get all documents from a collection
export const getDocuments = async (collectionName: string): Promise<QuerySnapshot<DocumentData>> => {
    try {
        return await getDocs(collection(db, collectionName));
    } catch (error) {
        console.error('Error getting documents: ', error);
        throw error;
    }
};

// Update a document
export const updateDocument = async (collectionName: string, docId: string, data: any) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error('Error updating document: ', error);
        throw error;
    }
};

// Delete a document
export const deleteDocument = async (collectionName: string, docId: string) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting document: ', error);
        throw error;
    }
};

// Query documents with conditions
export const queryDocuments = async (
    collectionName: string,
    conditions: Array<{ field: string; operator: any; value: any }> = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
) => {
    try {
        let q = collection(db, collectionName);

        // Add where conditions
        conditions.forEach(condition => {
            q = query(q, where(condition.field, condition.operator, condition.value));
        });

        // Add ordering
        if (orderByField) {
            q = query(q, orderBy(orderByField, orderDirection));
        }

        // Add limit
        if (limitCount) {
            q = query(q, limit(limitCount));
        }

        return await getDocs(q);
    } catch (error) {
        console.error('Error querying documents: ', error);
        throw error;
    }
}; 