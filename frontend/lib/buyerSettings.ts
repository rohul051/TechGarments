import type { BuyerTheme } from '@/types/user';

export const BUYER_TYPE_OPTIONS = [
  'Clothing Brand',
  'Retailer',
  'Wholesaler',
  'Importer / Exporter',
  'Individual / Startup',
] as const;

export type WorkspaceThemeRole = 'buyer' | 'factory' | 'admin';

export function getWorkspaceThemeStorageKey(role: WorkspaceThemeRole, email?: string): string {
  const clean = email?.trim().toLowerCase();
  const base = `techgarments_${role}_theme`;
  return clean ? `${base}_${clean}` : base;
}

export function getBuyerThemeStorageKey(email?: string): string {
  return getWorkspaceThemeStorageKey('buyer', email);
}

export function getBuyerSavedStorageKey(email?: string): string {
  const clean = email?.trim().toLowerCase();
  return clean ? `techgarments_saved_factories_${clean}` : 'techgarments_saved_factories';
}

export function getBuyerNotificationsStorageKey(email?: string): string {
  const clean = email?.trim().toLowerCase();
  return clean ? `techgarments_buyer_notifications_${clean}` : 'techgarments_buyer_notifications';
}

export function getFactoryNotificationsStorageKey(email?: string): string {
  const clean = email?.trim().toLowerCase();
  return clean ? `techgarments_factory_notifications_${clean}` : 'techgarments_factory_notifications';
}

export function loadSavedWorkspaceTheme(role: WorkspaceThemeRole, email?: string): BuyerTheme {
  if (typeof window === 'undefined') return 'default';
  try {
    const raw =
      localStorage.getItem(getWorkspaceThemeStorageKey(role, email)) ||
      localStorage.getItem(`techgarments_${role}_theme`);
    return raw === 'dark' || raw === 'light' || raw === 'default' ? raw : 'default';
  } catch {
    return 'default';
  }
}

export function persistWorkspaceTheme(
  role: WorkspaceThemeRole,
  theme: BuyerTheme,
  email?: string,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getWorkspaceThemeStorageKey(role, email), theme);
    localStorage.setItem(`techgarments_${role}_theme`, theme);
  } catch (error) {
    console.warn(`[${role} theme] Failed to save theme locally:`, error);
  }
}

export function loadSavedBuyerTheme(email?: string): BuyerTheme {
  return loadSavedWorkspaceTheme('buyer', email);
}

export function persistBuyerTheme(theme: BuyerTheme, email?: string): void {
  persistWorkspaceTheme('buyer', theme, email);
}

export function loadBuyerSavedFactories(email?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getBuyerSavedStorageKey(email));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function persistBuyerSavedFactories(ids: string[], email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getBuyerSavedStorageKey(email), JSON.stringify(ids));
  } catch (error) {
    console.warn('[Buyer saved factories] Failed to save locally:', error);
  }
}

export function normalizeWebsiteUrl(raw: string): { valid: boolean; value: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: true, value: '' };
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        valid: false,
        value: trimmed,
        error: 'Enter a valid website URL (for example, https://yourbrand.com).',
      };
    }
    return { valid: true, value: candidate };
  } catch {
    return {
      valid: false,
      value: trimmed,
      error: 'Enter a valid website URL (for example, https://yourbrand.com).',
    };
  }
}

function compressImageDataUrl(
  file: File,
  maxSize: number,
  quality: number,
  maxLength: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (PNG, JPG, WebP, or GIF).'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Image file must be 10 MB or smaller.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Your browser could not process this image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp') || dataUrl.length > maxLength) {
          dataUrl = canvas.toDataURL('image/jpeg', Math.min(0.84, quality));
        }
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error instanceof Error ? error : new Error('Failed to process selected image.'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Resizes and compresses a selected image file into a compact Data URL
 * suitable for immediate preview, localStorage, and Firestore profile documents.
 */
export function compressProfilePicture(file: File): Promise<string> {
  return compressImageDataUrl(file, 256, 0.86, 180_000);
}

/**
 * Resizes and compresses a wide background cover banner image for factory profiles.
 */
export function compressCoverImage(file: File): Promise<string> {
  return compressImageDataUrl(file, 1280, 0.84, 380_000);
}

function clearStoreRecordsForBuyer(
  dbName: string,
  storeName: string,
  matchesBuyer: (record: Record<string, unknown>) => boolean,
): Promise<void> {
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.close();
        resolve();
        return;
      }
      const tx = database.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const records = Array.isArray(getAllReq.result) ? getAllReq.result : [];
        for (const record of records) {
          if (record && typeof record === 'object' && matchesBuyer(record as Record<string, unknown>)) {
            const key = (record as { id?: unknown }).id;
            if (typeof key === 'string') {
              store.delete(key);
            }
          }
        }
      };
      tx.oncomplete = () => {
        database.close();
        resolve();
      };
      tx.onerror = () => {
        database.close();
        resolve();
      };
      tx.onabort = () => {
        database.close();
        resolve();
      };
    };
    request.onerror = () => resolve();
  });
}

export async function clearFactoryIndexedDbData(factoryId: string, factoryEmail: string): Promise<void> {
  const cleanEmail = factoryEmail.trim().toLowerCase();
  await Promise.all([
    clearStoreRecordsForBuyer('garmentconnect-production-quotes', 'quotes', (rec) =>
      rec.factoryId === factoryId ||
      (typeof rec.factoryEmail === 'string' && rec.factoryEmail.toLowerCase() === cleanEmail),
    ),
    clearStoreRecordsForBuyer('garmentconnect-orders', 'orders', (rec) =>
      rec.factoryId === factoryId ||
      (typeof rec.factoryEmail === 'string' && rec.factoryEmail.toLowerCase() === cleanEmail),
    ),
  ]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('garmentconnect:quotes-updated'));
    window.dispatchEvent(new Event('garmentconnect:orders-updated'));
  }
}

export async function clearBuyerIndexedDbData(buyerId: string, buyerEmail: string): Promise<void> {
  const cleanEmail = buyerEmail.trim().toLowerCase();
  await Promise.all([
    clearStoreRecordsForBuyer('garmentconnect-production-requests', 'requests', (rec) =>
      rec.ownerId === buyerId ||
      (typeof rec.ownerEmail === 'string' && rec.ownerEmail.toLowerCase() === cleanEmail),
    ),
    clearStoreRecordsForBuyer('garmentconnect-production-quotes', 'quotes', (rec) =>
      rec.buyerId === buyerId ||
      (typeof rec.buyerEmail === 'string' && rec.buyerEmail.toLowerCase() === cleanEmail),
    ),
    clearStoreRecordsForBuyer('garmentconnect-orders', 'orders', (rec) =>
      rec.buyerId === buyerId ||
      (typeof rec.buyerEmail === 'string' && rec.buyerEmail.toLowerCase() === cleanEmail),
    ),
  ]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('garmentconnect:production-requests-updated'));
    window.dispatchEvent(new Event('garmentconnect:quotes-updated'));
    window.dispatchEvent(new Event('garmentconnect:orders-updated'));
  }
}
