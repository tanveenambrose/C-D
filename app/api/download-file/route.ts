import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '../utils/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing download ID' }, { status: 400 });
    }

    const data = getFile(id);

    if (!data) {
        return NextResponse.json({ error: 'Download not found or expired' }, { status: 404 });
    }

    const fileName = data.fileName;
    let contentType = 'application/octet-stream';
    
    if (fileName.toLowerCase().endsWith('.pdf')) contentType = 'application/pdf';
    else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg') || fileName.toLowerCase().endsWith('.zip')) {
        contentType = 'application/octet-stream'; // Force download manager interception
    }
    else if (fileName.toLowerCase().endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    console.log(`Download-File: Delivering ${fileName} (ID: ${id}, Type: ${contentType})`);

    const encodedFileName = encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');

    console.log(`Download-File: Delivering ${fileName} (Headers: attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName})`);

    return new NextResponse(new Uint8Array(data.buffer), {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
            'X-Content-Type-Options': 'nosniff',
            'Content-Length': String(data.buffer.length),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
}
