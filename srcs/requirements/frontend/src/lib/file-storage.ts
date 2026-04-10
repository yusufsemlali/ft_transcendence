/**
 * LocalImageStorage - Stores images in browser's IndexedDB
 * Similar to Monkeytype's FileStorage implementation
 */

const DB_NAME = "tournify_storage";
const DB_VERSION = 1;
const STORE_NAME = "files";
const LOCAL_BG_KEY = "LocalBackgroundFile";

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * Get a stored file
 */
export async function getFile(key: string): Promise<string | null> {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * Delete a stored file
 */
export async function deleteFile(key: string): Promise<void> {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Check if a file exists
 */
export async function hasFile(key: string): Promise<boolean> {
    const file = await getFile(key);
    return file !== null;
}

// Convenience functions for local background
export async function getLocalBackground(): Promise<string | null> {
    try {
        return await getFile(LOCAL_BG_KEY);
    } catch {
        return null;
    }
}

export async function removeLocalBackground(): Promise<void> {
    return deleteFile(LOCAL_BG_KEY);
}

export async function hasLocalBackground(): Promise<boolean> {
    return hasFile(LOCAL_BG_KEY);
}
