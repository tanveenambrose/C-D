// Persistent in-memory store for temporary file downloads
// Designed to survive Next.js Hot Module Replacement (HMR) during development

type TempFile = {
    buffer: Buffer;
    fileName: string;
    createdAt: number;
};

// Singleton pattern for global store
const globalStore = global as unknown as { _fileStore: Map<string, TempFile> };
const fileStore = globalStore._fileStore || new Map<string, TempFile>();

if (process.env.NODE_ENV !== 'production') {
    globalStore._fileStore = fileStore;
}

// Cleanup old entries every 5 minutes
const cleanup = () => {
    const now = Date.now();
    const expiry = 5 * 60 * 1000; // 5 minutes
    for (const [id, data] of fileStore.entries()) {
        if (now - data.createdAt > expiry) {
            fileStore.delete(id);
        }
    }
};

// Start cleanup interval if not already started
if (!(globalStore as any)._cleanupStarted) {
    if (typeof setInterval !== 'undefined') {
        setInterval(cleanup, 60 * 1000);
        (globalStore as any)._cleanupStarted = true;
    }
}

export function storeFile(id: string, buffer: Buffer, fileName: string) {
    console.log(`Vault: Storing file ${fileName} (ID: ${id})`);
    fileStore.set(id, {
        buffer,
        fileName,
        createdAt: Date.now()
    });
}

export function getFile(id: string) {
    const data = fileStore.get(id);
    if (data) {
        console.log(`Vault: Retrieving file ${data.fileName} (ID: ${id})`);
    } else {
        console.warn(`Vault: File ID ${id} not found in store`);
    }
    return data;
}

export function removeFile(id: string) {
    fileStore.delete(id);
}

// Aliases
export const storePdf = storeFile;
export const getPdf = getFile;
export const removePdf = removeFile;
