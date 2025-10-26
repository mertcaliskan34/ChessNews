// Utility script to create admin accounts in Firestore
// This should be run manually to add admin users to the system

import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { AdminProfile, ADMIN_PERMISSIONS } from '../firebase/adminAuth';

interface CreateAdminData {
    email: string;
    password: string;
    displayName: string;
    permissions?: string[];
}

/**
 * Creates a new admin account with Firebase Auth and Firestore profile
 * This function should be called manually from the browser console
 * or integrated into a setup script
 */
export const createAdminAccount = async (adminData: CreateAdminData): Promise<void> => {
    const { email, password, displayName, permissions = [ADMIN_PERMISSIONS.ALL] } = adminData;
    
    try {
        console.log('🔑 Creating admin account for:', email);
        
        // 1. Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ Firebase Auth account created with UID:', user.uid);
        
        // 2. Create admin profile in Firestore
        const adminProfile: Omit<AdminProfile, 'uid'> = {
            email,
            displayName,
            role: 'admin',
            permissions,
            createdAt: new Date(),
            isActive: true
        };
        
        await setDoc(doc(db, 'admins', user.uid), adminProfile);
        
        console.log('✅ Admin profile created in Firestore');
        console.log('📋 Admin Details:', {
            uid: user.uid,
            email,
            displayName,
            permissions,
            isActive: true
        });
        
        console.log('🎉 Admin account successfully created!');
        console.log('⚠️ Please save the login credentials securely.');
        
    } catch (error) {
        console.error('❌ Error creating admin account:', error);
        throw error;
    }
};

/**
 * Pre-configured admin accounts for easy setup
 * Modify these as needed for your project
 */
export const DEFAULT_ADMIN_ACCOUNTS = [
    {
        email: 'admin@chessnews.com',
        password: 'AdminPassword123!',
        displayName: 'Super Admin',
        permissions: [ADMIN_PERMISSIONS.ALL]
    },
    {
        email: 'editor@chessnews.com', 
        password: 'EditorPassword123!',
        displayName: 'News Editor',
        permissions: [
            ADMIN_PERMISSIONS.NEWS_CREATE,
            ADMIN_PERMISSIONS.NEWS_READ,
            ADMIN_PERMISSIONS.NEWS_UPDATE,
            ADMIN_PERMISSIONS.NEWS_DELETE
        ]
    }
];

/**
 * Creates all default admin accounts
 * WARNING: Only run this once during initial setup
 */
export const createDefaultAdmins = async (): Promise<void> => {
    console.log('🚀 Creating default admin accounts...');
    
    for (const adminData of DEFAULT_ADMIN_ACCOUNTS) {
        try {
            await createAdminAccount(adminData);
            console.log(`✅ Created admin: ${adminData.email}`);
        } catch (error) {
            console.error(`❌ Failed to create admin: ${adminData.email}`, error);
        }
    }
    
    console.log('🎯 Default admin creation process completed!');
};

/**
 * Updates an existing admin's permissions
 */
export const updateAdminPermissions = async (uid: string, newPermissions: string[]): Promise<void> => {
    try {
        const adminRef = doc(db, 'admins', uid);
        await setDoc(adminRef, { permissions: newPermissions }, { merge: true });
        
        console.log('✅ Admin permissions updated:', { uid, permissions: newPermissions });
    } catch (error) {
        console.error('❌ Error updating admin permissions:', error);
        throw error;
    }
};

/**
 * Deactivates an admin account (doesn't delete, just sets isActive to false)
 */
export const deactivateAdmin = async (uid: string): Promise<void> => {
    try {
        const adminRef = doc(db, 'admins', uid);
        await setDoc(adminRef, { isActive: false }, { merge: true });
        
        console.log('✅ Admin account deactivated:', uid);
    } catch (error) {
        console.error('❌ Error deactivating admin:', error);
        throw error;
    }
};

/**
 * Browser console helper functions
 * You can copy-paste these into your browser console to create admins
 */
export const consoleHelpers = {
    createAdmin: createAdminAccount,
    createDefaultAdmins,
    updatePermissions: updateAdminPermissions,
    deactivateAdmin,
    permissions: ADMIN_PERMISSIONS
};

// Make functions available in browser console during development
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).adminUtils = consoleHelpers;
}

/*
USAGE INSTRUCTIONS:

1. Open your browser console on the ChessNews site
2. Run one of these commands:

// Create a single admin
await adminUtils.createAdmin({
    email: 'your-admin@example.com',
    password: 'YourSecurePassword123!',
    displayName: 'Your Name',
    permissions: [adminUtils.permissions.ALL] // or specific permissions
});

// Create all default admins (run only once during setup)
await adminUtils.createDefaultAdmins();

// Update admin permissions
await adminUtils.updatePermissions('user-uid-here', [adminUtils.permissions.NEWS_READ]);

// Deactivate an admin
await adminUtils.deactivateAdmin('user-uid-here');

SECURITY NOTES:
- Change default passwords immediately after creation
- Use strong, unique passwords for each admin
- Regularly review admin permissions
- Remove this script from production builds
*/ 