import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User, Role } from '@/types/user';

export interface AccountRecord {
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
}

const STORAGE_USERS_KEY = 'techgarments_registered_users';
const STORAGE_CURRENT_USER_KEY = 'user';

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

    const user: User = {
      id: crypto.randomUUID(),
      email: matched.email,
      fullName: matched.fullName,
      role: matched.role,
      ...(matched.role === 'ADMIN' ? { adminRole: 'SUPER_ADMIN' as const } : {}),
    };

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }

    // Also sync Firebase Auth in background
    try {
      signInWithEmailAndPassword(auth, matched.email, password).catch(() => {});
    } catch {}

    return user;
  }

  // 2. Check Firebase Authentication with email
  if (clean.includes('@')) {
    try {
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
            role: (data.role as Role) || 'BUYER',
          };
          localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
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
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
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
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    window.dispatchEvent(new Event('storage'));
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  return user ? (JSON.parse(user) as User) : null;
}
