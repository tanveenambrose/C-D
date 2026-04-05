import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'stream';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const targetFormat = (formData.get('format') as string || 'zip').toLowerCase();
    const operation = formData.get('operation') as string || 'compress';

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // In a real-world scenario with large files, we should stream to a temp file
    // For this implementation, we'll use a pass-through-like approach or buffer for simplicity
    // given typical serverless/edge limits. 
    
    const chunks: Uint8Array[] = [];
    const archive = archiver(targetFormat as any, {
      zlib: { level: 9 } // Sets the compression level.
    });

    const outputStream = new Readable({
      read() {}
    });

    archive.on('data', (chunk) => chunks.push(chunk));
    
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err) => reject(err));
    });

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      archive.append(Buffer.from(arrayBuffer), { name: file.name });
    }

    await archive.finalize();
    const resultBuffer = await archivePromise;

    const mimeTypes: Record<string, string> = {
      zip: 'application/zip',
      tar: 'application/x-tar',
    };

    const outName = files.length === 1 && operation !== 'compress'
      ? `${files[0].name.split('.')[0]}.${targetFormat}`
      : `archive_${Date.now()}.${targetFormat}`;

    return new NextResponse(new Uint8Array(resultBuffer) as any, {
      status: 200,
      headers: {
        'Content-Type': mimeTypes[targetFormat] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'Content-Length': String(resultBuffer.length),
      },
    });

  } catch (error: any) {
    console.error('Local Archive Engine Error:', error);
    return NextResponse.json({ error: error.message || 'Server error during local archiving' }, { status: 500 });
  }
}
