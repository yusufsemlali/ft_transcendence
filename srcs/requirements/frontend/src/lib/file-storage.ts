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
 * Store a file as base64 data URL
 */
export async function storeFile(key: string, dataUrl: string): Promise<void> {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(dataUrl, key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
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

export async function setLocalBackground(dataUrl: string): Promise<void> {
    return storeFile(LOCAL_BG_KEY, dataUrl);
}

export async function removeLocalBackground(): Promise<void> {
    return deleteFile(LOCAL_BG_KEY);
}

export async function hasLocalBackground(): Promise<boolean> {
    return hasFile(LOCAL_BG_KEY);
}

/**
 * Handle file upload and convert to data URL
 */
export function handleImageUpload(
    onSuccess: (dataUrl: string) => void,
    onError: (error: string) => void
): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/jpg,image/gif,image/webp";
    input.style.display = "none";
    document.body.appendChild(input);

    const cleanup = () => {
        document.body.removeChild(input);
    };

    input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            cleanup();
            return;
        }

        // Validate file type
        if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
            onError("Unsupported image format. Use PNG, JPG, GIF, or WebP.");
            cleanup();
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            onError("Image too large. Maximum size is 5MB.");
            cleanup();
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const dataUrl = readerEvent.target?.result as string;
            onSuccess(dataUrl);
            cleanup();
        };
        reader.onerror = () => {
            onError("Failed to read file.");
            cleanup();
        };
        reader.readAsDataURL(file);
    };

    input.click();
}
