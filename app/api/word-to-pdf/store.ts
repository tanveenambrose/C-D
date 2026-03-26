// Simple in-memory store for temporary PDF downloads
// In a production environment, this would use Redis or a similar persistent store
// For this application, a global Map is sufficient for short-term caching

type TempPdf = {
    buffer: Buffer;
    fileName: string;
    createdAt: number;
};

const pdfStore = new Map<string, TempPdf>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        const expiry = 5 * 60 * 1000; // 5 minutes
        for (const [id, data] of pdfStore.entries()) {
            if (now - data.createdAt > expiry) {
                pdfStore.delete(id);
            }
        }
    }, 60 * 1000);
}

export function storePdf(id: string, buffer: Buffer, fileName: string) {
    pdfStore.set(id, {
        buffer,
        fileName,
        createdAt: Date.now()
    });
}

export function getPdf(id: string) {
    return pdfStore.get(id);
}

export function removePdf(id: string) {
    pdfStore.delete(id);
}
