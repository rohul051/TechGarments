import {
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signOut as firebaseSignOut,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User, Role } from '@/types/user';

export interface AccountRecord {
  id?: string;
  email: string;
  username?: string;
  password: string;
  fullName: string;
  role: Role;
  phone?: string;
  companyName?: string;
  buyerType?: string;
  country?: string;
  city?: string;
  website?: string;
  monthlyCapacity?: number;
  moq?: number;
  processes?: string[];
  products?: string[];
  workerCount?: number;
  productionLines?: number;
  machineInformation?: string;
}

const STORAGE_USERS_KEY = 'techgarments_registered_users';
const STORAGE_CURRENT_USER_KEY = 'user';

function isRole(value: unknown): value is Role {
  return value === 'BUYER' || value === 'FACTORY' || value === 'ADMIN';
}

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return isRole(normalized) ? normalized : null;
}

export function saveCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('storage'));
}

export function waitForFirebaseUser(): Promise<FirebaseAuthUser | null> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        unsubscribe();
        resolve(firebaseUser);
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}

export async function restoreUserFromFirebase(): Promise<User | null> {
  const firebaseUser = await waitForFirebaseUser();
  const email = firebaseUser?.email?.trim().toLowerCase();
  if (!firebaseUser || !email) return null;

  const account = findAccount(email);
  let userProfile: Record<string, unknown> = {};
  try {
    const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userSnapshot.exists()) userProfile = userSnapshot.data();
  } catch (error) {
    if (!account) throw error;
    console.error('[Auth] Could not restore the cloud profile; using the registered local account:', error);
  }

  const role = normalizeRole(userProfile.role) ?? normalizeRole(account?.role);
  if (!isRole(role)) return null;

  const user: User = {
    id: firebaseUser.uid,
    email,
    fullName: account?.fullName || (typeof userProfile.fullName === 'string' ? userProfile.fullName : '') || email.split('@')[0],
    role,
    ...(role === 'ADMIN' ? { adminRole: 'SUPER_ADMIN' as const } : {}),
  };
  saveCurrentUser(user);
  return user;
}

// Built-in administrative account for platform management
const DEFAULT_ADMIN_ACCOUNT: AccountRecord = {
  email: 'admin@techgarments.com',
  username: 'admin',
  password: 'adminpassword123',
  fullName: 'Super Administrator',
  role: 'ADMIN',
  companyName: 'TechGarments Executive',
};

/**
 * Get all registered accounts from local persistence
 */
export function getRegisteredAccounts(): Record<string, AccountRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_USERS_KEY);
    const accounts = stored ? JSON.parse(stored) : {};
    
    // Ensure default admin account is always accessible
    if (!accounts['admin@techgarments.com']) {
      accounts['admin@techgarments.com'] = DEFAULT_ADMIN_ACCOUNT;
      accounts['admin'] = DEFAULT_ADMIN_ACCOUNT;
    }
    return accounts;
  } catch {
    return {
      'admin@techgarments.com': DEFAULT_ADMIN_ACCOUNT,
      'admin': DEFAULT_ADMIN_ACCOUNT,
    };
  }
}

/**
 * Save an account into local persistence (indexed by email and username)
 */
export function saveRegisteredAccount(account: AccountRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRegisteredAccounts();
    const cleanEmail = account.email.trim().toLowerCase();
    const cleanUsername = (account.username || cleanEmail.split('@')[0]).trim().toLowerCase();

    const record: AccountRecord = {
      ...account,
      email: cleanEmail,
      username: cleanUsername,
    };

    current[cleanEmail] = record;
    if (cleanUsername) {
      current[cleanUsername] = record;
    }

    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save user account:', err);
    throw err;
  }
}

/**
 * Find account by email OR username OR email prefix
 */
export function findAccount(identifier: string): AccountRecord | undefined {
  const accounts = getRegisteredAccounts();
  const clean = identifier.trim().toLowerCase();

  // 1. Direct key match (by email or username)
  if (accounts[clean]) return accounts[clean];

  // 2. Iterate through registered accounts
  for (const acc of Object.values(accounts)) {
    if (acc.email.toLowerCase() === clean) return acc;
    if (acc.username && acc.username.toLowerCase() === clean) return acc;
    const prefix = acc.email.split('@')[0].toLowerCase();
    if (prefix === clean) return acc;
  }

  return undefined;
}

/**
 * Register a new user using Firebase Auth + Cloud Firestore and local persistence
 */
export async function register(accountData: AccountRecord): Promise<User> {
  const email = accountData.email.trim().toLowerCase();
  const username = (accountData.username || email.split('@')[0]).trim().toLowerCase();
  let uid = crypto.randomUUID();

  // 1. Firebase Authentication & Cloud Firestore
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, accountData.password);
    uid = cred.user.uid;

    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      username,
      fullName: accountData.fullName,
      role: accountData.role,
      phoneNumber: accountData.phone || '',
      createdAt: now,
      updatedAt: now,
    });

    if (accountData.role === 'BUYER') {
      await setDoc(doc(db, 'buyers', uid), {
        id: uid,
        fullName: accountData.fullName,
        username,
        email,
        phone: accountData.phone || '',
        companyName: accountData.companyName || 'My Brand',
        buyerType: accountData.buyerType || 'Clothing Brand',
        country: accountData.country || 'Other',
        website: accountData.website || '',
        createdAt: now,
        updatedAt: now,
      });
    } else if (accountData.role === 'FACTORY') {
      await setDoc(doc(db, 'factories', uid), {
        id: uid,
        fullName: accountData.fullName,
        username,
        email,
        phone: accountData.phone || '',
        companyName: accountData.companyName || 'Garment Factory',
        country: accountData.country || 'Other',
        city: accountData.city || '',
        website: accountData.website || '',
        monthlyCapacity: accountData.monthlyCapacity || 50000,
        moq: accountData.moq || 500,
        processes: accountData.processes || ['Cutting', 'Sewing', 'Finishing'],
        products: accountData.products || ['T-shirt', 'Shirt'],
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (firebaseError: unknown) {
    console.warn('[Firebase Auth/Firestore] Storing locally:', firebaseError);
  }

  // 2. Save locally
  saveRegisteredAccount({
    ...accountData,
    id: uid,
    email,
    username,
  });

  const user: User = {
    id: uid,
    email,
    fullName: accountData.fullName,
    role: accountData.role,
  };

  // 3. Sync with backend API if available
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        email,
        username,
        password: accountData.password,
        fullName: accountData.fullName,
        role: accountData.role,
        phone: accountData.phone,
        profileDetails: {
          companyName: accountData.companyName,
          buyerType: accountData.buyerType,
          country: accountData.country,
          city: accountData.city,
          website: accountData.website,
          monthlyCapacity: accountData.monthlyCapacity,
          moq: accountData.moq,
          processes: accountData.processes,
          products: accountData.products,
        },
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  return user;
}

/**
 * Real login function: validates against real Firebase Auth / Cloud Firestore and registered accounts
 */
export async function login(identifier: string, password: string): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const clean = identifier.trim().toLowerCase();
  const matched = findAccount(clean);

  // 1. Check registered account
  if (matched) {
    if (matched.password !== password) {
      throw new Error('The password you entered is incorrect.');
    }

    const role = normalizeRole(matched.role);
    if (!role) throw new Error('This account has an invalid role. Contact support for help.');

    const userId = matched.id || `local:${matched.email.trim().toLowerCase()}`;

    const user: User = {
      id: userId,
      email: matched.email,
      fullName: matched.fullName,
      role,
      ...(role === 'ADMIN' ? { adminRole: 'SUPER_ADMIN' as const } : {}),
    };

    saveCurrentUser(user);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, matched.email, password);
    } catch (error) {
      console.warn('[Firebase Auth] Could not persist local-account sign-in; retaining the local session:', error);
    }

    return user;
  }

  // 2. Check Firebase Authentication with email
  if (clean.includes('@')) {
    try {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.warn('[Firebase Auth] Could not enable browser-local persistence:', error);
      }
      const userCredential = await signInWithEmailAndPassword(auth, clean, password);
      const firebaseUid = userCredential.user.uid;

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const user: User = {
            id: firebaseUid,
            email: clean,
            fullName: data.fullName || clean.split('@')[0],
            role: normalizeRole(data.role) ?? 'BUYER',
          };
          saveCurrentUser(user);
          return user;
        }
      } catch {
        // Fallback to minimal user
      }

      const user: User = {
        id: firebaseUid,
        email: clean,
        fullName: clean.split('@')[0],
        role: 'BUYER',
      };
      saveCurrentUser(user);
      return user;
    } catch (firebaseError: unknown) {
      console.warn('[Firebase Auth Error]:', firebaseError);
    }
  }

  // If no account matches, reject authentication (no demo accounts, no auto-register)
  throw new Error('The username/email or password you entered is incorrect. Please register first if you do not have an account.');
}

export function logout(): void {
  try {
    firebaseSignOut(auth).catch(() => {});
  } catch {
    // Ignore error
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    } catch (error) {
      console.error('[Auth] Could not clear the local session:', error);
    }
    window.dispatchEvent(new Event('storage'));
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!stored) return null;

    const user = JSON.parse(stored) as Partial<User>;
    const role = normalizeRole(user.role);
    if (
      typeof user.id === 'string' &&
      typeof user.email === 'string' &&
      typeof user.fullName === 'string' &&
      role
    ) {
      return { ...user, role } as User;
    }

    console.error('[Auth] Stored user session is invalid.');
    return null;
  } catch (error) {
    console.error('[Auth] Could not read the stored user session:', error);
    return null;
  }
}
