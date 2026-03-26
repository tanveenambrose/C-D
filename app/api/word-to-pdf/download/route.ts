import { NextRequest, NextResponse } from 'next/server';
import { getPdf } from '../../utils/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing download ID' }, { status: 400 });
    }

    const data = getPdf(id);

    if (!data) {
        return NextResponse.json({ error: 'Download not found or expired' }, { status: 404 });
    }

    console.log(`Word-to-PDF: Downloading ${data.fileName} (ID: ${id})`);

    return new NextResponse(new Uint8Array(data.buffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${data.fileName}"`,
            'Content-Length': String(data.buffer.length)
        }
    });
}
