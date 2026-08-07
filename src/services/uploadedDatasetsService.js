// IndexedDB-backed persistence for user-uploaded CSV datasets.
// Keeps uploads available across reloads without needing a backend —
// consistent with this app's fully offline, client-side design.

const DB_NAME = 'pyphone_datasets_db';
const DB_VERSION = 1;
const STORE_NAME = 'uploaded_datasets';

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB, mobile-friendly cap

function openDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persist an uploaded CSV dataset. Returns the saved record (includes generated id).
 */
export async function saveUploadedDataset({ name, filename, csv, size }) {
  const db = await openDb();
  const record = {
    id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    filename,
    csv,
    size: size ?? csv.length,
    uploadedAt: new Date().toISOString()
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Load all persisted uploaded datasets, newest first.
 */
export async function getAllUploadedDatasets() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const records = request.result || [];
        records.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load uploaded datasets from IndexedDB:', err);
    return [];
  }
}

/**
 * Remove a persisted uploaded dataset by id.
 */
export async function deleteUploadedDataset(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
