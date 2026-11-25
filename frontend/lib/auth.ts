import {
  EmailAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { BuyerTheme, Role, User } from '@/types/user';

export interface AccountRecord {
  id?: string;
  email: string;
  password: string;
  fullName: string;
  role: Role;
  phone?: string;
  companyName?: string;
  buyerType?: string;
  country?: string;
  city?: string;
  website?: string;
  photoURL?: string;
  theme?: BuyerTheme;
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

export function normalizeBuyerTheme(value: unknown): BuyerTheme {
  return value === 'dark' || value === 'light' || value === 'default' ? value : 'default';
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
  let factoryDocData: Record<string, unknown> | null = null;
  let buyerDocData: Record<string, unknown> | null = null;
  try {
    const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userSnapshot.exists()) {
      userProfile = userSnapshot.data();
    } else {
      const [factorySnapshot, buyerSnapshot] = await Promise.all([
        getDoc(doc(db, 'factories', firebaseUser.uid)),
        getDoc(doc(db, 'buyers', firebaseUser.uid)),
      ]);
      if (factorySnapshot.exists()) factoryDocData = factorySnapshot.data();
      if (buyerSnapshot.exists()) buyerDocData = buyerSnapshot.data();
    }
  } catch (error) {
    if (!account) throw error;
    console.error('[Auth] Could not restore the cloud profile; using the registered local account:', error);
  }

  if (userProfile.isActive === false) return null;

  const role =
    normalizeRole(userProfile.role) ??
    (factoryDocData ? 'FACTORY' : buyerDocData ? 'BUYER' : null) ??
    normalizeRole(account?.role);
  if (!isRole(role)) return null;

  const photoURL =
    account?.photoURL ||
    (typeof userProfile.photoURL === 'string' ? userProfile.photoURL : undefined);

  const user: User = {
    id: firebaseUser.uid,
    email,
    fullName:
      account?.fullName ||
      (typeof userProfile.fullName === 'string' ? userProfile.fullName : '') ||
      (typeof factoryDocData?.fullName === 'string' ? factoryDocData.fullName : '') ||
      (typeof buyerDocData?.fullName === 'string' ? buyerDocData.fullName : '') ||
      firebaseUser.displayName ||
      email.split('@')[0],
    role,
    ...(photoURL ? { photoURL } : {}),
    ...(account?.theme ? { theme: account.theme } : {}),
    ...(role === 'ADMIN' ? { adminRole: 'SUPER_ADMIN' as const } : {}),
  };
  saveCurrentUser(user);
  return user;
}

// Built-in administrative account for platform management (email-based only)
const DEFAULT_ADMIN_ACCOUNT: AccountRecord = {
  email: 'admin@techgarments.com',
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
    const accounts: Record<string, AccountRecord> = stored ? JSON.parse(stored) : {};

    // Clean out any legacy non-email keys so login strictly matches registered email IDs
    for (const key of Object.keys(accounts)) {
      if (!key.includes('@')) {
        delete accounts[key];
      }
    }

    // Ensure default admin account is always accessible by email
    if (!accounts['admin@techgarments.com']) {
      accounts['admin@techgarments.com'] = DEFAULT_ADMIN_ACCOUNT;
    }
    return accounts;
  } catch {
    return {
      'admin@techgarments.com': DEFAULT_ADMIN_ACCOUNT,
    };
  }
}

/**
 * Save an account into local persistence (indexed strictly by email)
 */
export function saveRegisteredAccount(account: AccountRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRegisteredAccounts();
    const cleanEmail = account.email.trim().toLowerCase();

    const record: AccountRecord = {
      ...account,
      email: cleanEmail,
    };

    current[cleanEmail] = record;

    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save user account:', err);
    throw err;
  }
}

/**
 * Remove a registered account from local persistence by email
 */
export function removeRegisteredAccount(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRegisteredAccounts();
    const cleanEmail = email.trim().toLowerCase();

    for (const [key, acc] of Object.entries(current)) {
      if (key.toLowerCase() === cleanEmail || acc.email.toLowerCase() === cleanEmail) {
        delete current[key];
      }
    }

    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to remove local user account:', err);
  }
}

/**
 * Find account strictly by registered email address
 */
export function findAccount(email: string): AccountRecord | undefined {
  const accounts = getRegisteredAccounts();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return undefined;

  if (accounts[cleanEmail]) return accounts[cleanEmail];

  for (const acc of Object.values(accounts)) {
    if (acc.email.toLowerCase() === cleanEmail) return acc;
  }

  return undefined;
}

/**
 * Register a new user (Buyer or Factory) using Email ID + Password via Firebase Auth, Firestore, and local persistence
 */
export async function register(accountData: AccountRecord): Promise<User> {
  const email = accountData.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!accountData.password || accountData.password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  let uid = crypto.randomUUID();

  // 1. Firebase Authentication & Cloud Firestore
  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {});
    const cred = await createUserWithEmailAndPassword(auth, email, accountData.password);
    uid = cred.user.uid;

    if (accountData.fullName) {
      await updateProfile(cred.user, { displayName: accountData.fullName }).catch(() => {});
    }

    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', uid), {
      uid,
      email,
      fullName: accountData.fullName,
      role: accountData.role,
      phoneNumber: accountData.phone || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    if (accountData.role === 'BUYER') {
      await setDoc(doc(db, 'buyers', uid), {
        id: uid,
        fullName: accountData.fullName,
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
    const code = getFirebaseErrorCode(firebaseError);
    if (code === 'auth/email-already-in-use') {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please choose at least 6 characters.');
    }

    // Fallback to local registration only when offline or Firebase config is unreachable
    if (findAccount(email)) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }
    console.warn('[Firebase Auth/Firestore] Falling back to local registration:', firebaseError);
  }

  // 2. Save locally keyed by email
  saveRegisteredAccount({
    ...accountData,
    id: uid,
    email,
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
 * Login with registered Email ID + Password (supports Buyer, Factory, and Admin)
 */
export async function login(emailInput: string, password: string): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid registered email address.');
  }

  const matched = findAccount(cleanEmail);

  // 1. Check registered account by email
  if (matched) {
    let resolvedMatched = matched;

    if (matched.password !== password) {
      let verifiedWithFirebase = false;
      try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, matched.email, password);
        resolvedMatched = { ...matched, password };
        saveRegisteredAccount(resolvedMatched);
        verifiedWithFirebase = true;
      } catch {
        verifiedWithFirebase = false;
      }
      if (!verifiedWithFirebase) {
        throw new Error('The email address or password you entered is incorrect.');
      }
    }

    const role = normalizeRole(resolvedMatched.role);
    if (!role) throw new Error('This account has an invalid role. Contact support for help.');

    const userId = resolvedMatched.id || `local:${resolvedMatched.email.trim().toLowerCase()}`;

    const user: User = {
      id: userId,
      email: resolvedMatched.email,
      fullName: resolvedMatched.fullName,
      role,
      ...(resolvedMatched.photoURL ? { photoURL: resolvedMatched.photoURL } : {}),
      ...(resolvedMatched.theme ? { theme: resolvedMatched.theme } : {}),
      ...(role === 'ADMIN' ? { adminRole: 'SUPER_ADMIN' as const } : {}),
    };

    saveCurrentUser(user);

    try {
      await setPersistence(auth, browserLocalPersistence);
      if (auth.currentUser?.email?.toLowerCase() !== resolvedMatched.email.toLowerCase()) {
        await signInWithEmailAndPassword(auth, resolvedMatched.email, password);
      }
    } catch (error) {
      console.warn('[Firebase Auth] Could not persist local-account sign-in; retaining the local session:', error);
    }

    return user;
  }

  // 2. Authenticate directly against Firebase Auth + Cloud Firestore (Buyer or Factory)
  try {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.warn('[Firebase Auth] Could not enable browser-local persistence:', error);
    }

    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const firebaseUid = userCredential.user.uid;

    let resolvedRole: Role = 'BUYER';
    let resolvedName = userCredential.user.displayName || cleanEmail.split('@')[0];
    let resolvedPhotoURL: string | undefined;
    let resolvedTheme: BuyerTheme | undefined;
    let resolvedPhone = '';
    let resolvedCompany = '';
    let resolvedCountry = '';
    let resolvedCity = '';
    let resolvedWebsite = '';
    let resolvedBuyerType = '';
    let factoryExtras: Partial<AccountRecord> = {};

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.isActive === false) {
          await firebaseSignOut(auth).catch(() => {});
          throw new Error('This account has been deleted. Please create a new account.');
        }
        resolvedRole = normalizeRole(data.role) ?? 'BUYER';
        if (typeof data.fullName === 'string' && data.fullName) resolvedName = data.fullName;
        if (typeof data.photoURL === 'string' && data.photoURL) resolvedPhotoURL = data.photoURL;
        if (typeof data.phoneNumber === 'string') resolvedPhone = data.phoneNumber;
      }

      if (resolvedRole === 'FACTORY' || !userDoc.exists()) {
        const factoryDoc = await getDoc(doc(db, 'factories', firebaseUid));
        if (factoryDoc.exists()) {
          const fData = factoryDoc.data();
          resolvedRole = 'FACTORY';
          if (typeof fData.fullName === 'string' && fData.fullName) resolvedName = fData.fullName;
          if (typeof fData.phone === 'string' && fData.phone) resolvedPhone = fData.phone;
          if (typeof fData.companyName === 'string') resolvedCompany = fData.companyName;
          if (typeof fData.country === 'string') resolvedCountry = fData.country;
          if (typeof fData.city === 'string') resolvedCity = fData.city;
          if (typeof fData.website === 'string') resolvedWebsite = fData.website;
          factoryExtras = {
            ...(typeof fData.monthlyCapacity === 'number' ? { monthlyCapacity: fData.monthlyCapacity } : {}),
            ...(typeof fData.moq === 'number' ? { moq: fData.moq } : {}),
            ...(Array.isArray(fData.processes) ? { processes: fData.processes.filter((v): v is string => typeof v === 'string') } : {}),
            ...(Array.isArray(fData.products) ? { products: fData.products.filter((v): v is string => typeof v === 'string') } : {}),
            ...(typeof fData.workerCount === 'number' ? { workerCount: fData.workerCount } : {}),
            ...(typeof fData.productionLines === 'number' ? { productionLines: fData.productionLines } : {}),
            ...(typeof fData.machineInformation === 'string' ? { machineInformation: fData.machineInformation } : {}),
          };
        }
      }

      if (resolvedRole === 'BUYER') {
        const buyerDoc = await getDoc(doc(db, 'buyers', firebaseUid));
        if (buyerDoc.exists()) {
          const bData = buyerDoc.data();
          if (typeof bData.fullName === 'string' && bData.fullName) resolvedName = bData.fullName;
          if (typeof bData.phone === 'string' && bData.phone) resolvedPhone = bData.phone;
          if (typeof bData.companyName === 'string') resolvedCompany = bData.companyName;
          if (typeof bData.buyerType === 'string') resolvedBuyerType = bData.buyerType;
          if (typeof bData.country === 'string') resolvedCountry = bData.country;
          if (typeof bData.website === 'string') resolvedWebsite = bData.website;
          if (typeof bData.photoURL === 'string' && bData.photoURL) resolvedPhotoURL = bData.photoURL;
          if (typeof bData.theme === 'string') resolvedTheme = normalizeBuyerTheme(bData.theme);
        }
      }
    } catch (docError) {
      if (docError instanceof Error && docError.message.includes('deleted')) {
        throw docError;
      }
    }

    saveRegisteredAccount({
      id: firebaseUid,
      email: cleanEmail,
      password,
      fullName: resolvedName,
      role: resolvedRole,
      phone: resolvedPhone,
      companyName: resolvedCompany,
      buyerType: resolvedBuyerType,
      country: resolvedCountry,
      city: resolvedCity,
      website: resolvedWebsite,
      ...factoryExtras,
      ...(resolvedPhotoURL ? { photoURL: resolvedPhotoURL } : {}),
      ...(resolvedTheme ? { theme: resolvedTheme } : {}),
    });

    const user: User = {
      id: firebaseUid,
      email: cleanEmail,
      fullName: resolvedName,
      role: resolvedRole,
      ...(resolvedPhotoURL ? { photoURL: resolvedPhotoURL } : {}),
      ...(resolvedTheme ? { theme: resolvedTheme } : {}),
      ...(resolvedRole === 'ADMIN' ? { adminRole: 'SUPER_ADMIN' as const } : {}),
    };
    saveCurrentUser(user);
    return user;
  } catch (firebaseError: unknown) {
    if (firebaseError instanceof Error && firebaseError.message.includes('deleted')) {
      throw firebaseError;
    }
    const code = getFirebaseErrorCode(firebaseError);
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many failed sign-in attempts. Please try again later.');
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('Network error while connecting to Firebase. Please check your connection and try again.');
    }
    console.warn('[Firebase Auth Error]:', firebaseError);
  }

  throw new Error('The email address or password you entered is incorrect. Please register first if you do not have an account.');
}

function getFirebaseErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string'
    ? (error as { code: string }).code
    : '';
}

export async function updateBuyerAuthDisplayName(fullName: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !fullName.trim()) return;
  try {
    await updateProfile(currentUser, { displayName: fullName.trim() });
  } catch (error) {
    console.warn('[Firebase Auth] Could not update displayName:', error);
  }
}

export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  if (!currentPassword) {
    throw new Error('Please enter your current password.');
  }
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }
  if (currentPassword === newPassword) {
    throw new Error('New password must be different from your current password.');
  }

  const localAccount = findAccount(cleanEmail);
  const firebaseUser = auth.currentUser;
  const matchingFirebaseUser =
    firebaseUser && firebaseUser.email?.toLowerCase() === cleanEmail ? firebaseUser : null;

  let firebaseUpdated = false;
  if (matchingFirebaseUser) {
    try {
      const credential = EmailAuthProvider.credential(cleanEmail, currentPassword);
      await reauthenticateWithCredential(matchingFirebaseUser, credential);
      await updatePassword(matchingFirebaseUser, newPassword);
      firebaseUpdated = true;
    } catch (error) {
      const code = getFirebaseErrorCode(error);
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Your current password is incorrect.');
      }
      if (code === 'auth/weak-password') {
        throw new Error('Please choose a stronger password (at least 6 characters).');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please wait a moment and try again.');
      }
      if (code === 'auth/requires-recent-login') {
        throw new Error('Please sign out and sign back in before changing your password.');
      }
      if (code !== 'auth/network-request-failed' || !localAccount) {
        throw new Error(error instanceof Error ? error.message : 'Unable to update your password in Firebase.');
      }
    }
  } else if (localAccount) {
    if (localAccount.password !== currentPassword) {
      throw new Error('Your current password is incorrect.');
    }
    if (cleanEmail.includes('@')) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, currentPassword);
        await updatePassword(cred.user, newPassword);
        firebaseUpdated = true;
      } catch (error) {
        const code = getFirebaseErrorCode(error);
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          throw new Error('Your current password is incorrect.');
        }
      }
    }
  } else {
    throw new Error('Your active sign-in session could not be verified. Please sign in again.');
  }

  if (localAccount) {
    saveRegisteredAccount({ ...localAccount, password: newPassword });
  }

  return firebaseUpdated
    ? 'Password updated in Firebase Authentication and synced to your account.'
    : 'Password updated for your local buyer account.';
}

export async function sendUserPasswordReset(email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('A valid email address is required to send a password reset link.');
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return `Password reset email sent to ${cleanEmail}. Check your inbox (and spam folder) for the link.`;
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    if (code === 'auth/user-not-found') {
      throw new Error(`No Firebase Authentication user was found for ${cleanEmail}. Ensure Email/Password auth is enabled and the account is registered online.`);
    }
    if (code === 'auth/invalid-email') {
      throw new Error('The account email address is invalid.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many password reset requests. Please wait a few minutes before trying again.');
    }
    if (code === 'auth/configuration-not-found') {
      throw new Error('Firebase Email/Password authentication is not yet enabled for this Firebase project.');
    }
    throw new Error(error instanceof Error ? error.message : 'Could not send password reset email.');
  }
}

export async function deleteUserAccount(email: string, password: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!password) {
    throw new Error('Please enter your password to confirm account deletion.');
  }

  const localAccount = findAccount(cleanEmail);
  let firebaseUser =
    auth.currentUser && auth.currentUser.email?.toLowerCase() === cleanEmail
      ? auth.currentUser
      : null;

  if (!firebaseUser && cleanEmail.includes('@')) {
    try {
      const signedIn = await signInWithEmailAndPassword(auth, cleanEmail, password);
      firebaseUser = signedIn.user;
    } catch (error) {
      const code = getFirebaseErrorCode(error);
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('The password you entered is incorrect.');
      }
    }
  }

  if (firebaseUser) {
    try {
      const credential = EmailAuthProvider.credential(cleanEmail, password);
      await reauthenticateWithCredential(firebaseUser, credential);
    } catch (error) {
      const code = getFirebaseErrorCode(error);
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('The password you entered is incorrect.');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please wait a moment and try again.');
      }
      if (code !== 'auth/network-request-failed') {
        throw new Error(error instanceof Error ? error.message : 'Could not verify your password before deleting.');
      }
    }

    const now = new Date().toISOString();
    try {
      await deleteDoc(doc(db, 'buyers', firebaseUser.uid));
    } catch (err) {
      console.warn('[Account Delete] Could not delete buyers doc:', err);
    }
    try {
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          isActive: false,
          fullName: 'Deleted User',
          phoneNumber: '',
          photoURL: '',
          deletedAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    } catch (err) {
      console.warn('[Account Delete] Could not mark users doc inactive:', err);
    }

    try {
      await deleteUser(firebaseUser);
    } catch (error) {
      const code = getFirebaseErrorCode(error);
      if (code === 'auth/requires-recent-login') {
        throw new Error('Please sign out, sign back in, and retry deleting your account.');
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to delete your Firebase user account.');
    }
  } else if (localAccount) {
    if (localAccount.password !== password) {
      throw new Error('The password you entered is incorrect.');
    }
  } else {
    throw new Error('Account session not found. Please sign in again.');
  }

  removeRegisteredAccount(cleanEmail);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`techgarments_buyer_theme_${cleanEmail}`);
    localStorage.removeItem(`techgarments_saved_factories_${cleanEmail}`);
    localStorage.removeItem(`techgarments_buyer_notifications_${cleanEmail}`);
  }
  logout();
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
