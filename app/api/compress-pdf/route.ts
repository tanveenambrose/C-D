import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('Compress-PDF: No file provided in FormData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const secret = process.env.CONVERT_API_SECRET;
    if (!secret) {
      console.error('Compress-PDF: Missing CONVERT_API_SECRET');
      return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
    }

    // ConvertAPI Compress PDF endpoint: https://v2.convertapi.com/convert/pdf/to/compress
    const apiUrl = `https://v2.convertapi.com/convert/pdf/to/compress`;

    const apiForm = new FormData();
    apiForm.append('File', file, file.name);
    // Presets available: lossless, ebook, printer, screen, etc.
    // 'ebook' is a good balance for efficiency and accuracy (quality)
    apiForm.append('Preset', 'ebook'); 

    console.log(`Compress-PDF: Compressing ${file.name} via ${apiUrl} (${file.size} bytes)`);

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
      body: apiForm,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error(`Compress-PDF: ConvertAPI returned error (${apiRes.status}):`, errText);
      return NextResponse.json({ error: `Compression failed: ${errText}` }, { status: 500 });
    }

    const result = await apiRes.json();
    const fileData = result?.Files?.[0];

    if (!fileData || !fileData.FileData) {
      console.error('Compress-PDF: No file returned from ConvertAPI');
      return NextResponse.json({ error: 'No file returned from conversion service' }, { status: 500 });
    }

    const compressedBase64 = fileData.FileData;
    const outputName = file.name.replace(/\.pdf$/i, '_compressed.pdf');
    const downloadId = crypto.randomUUID();

    // Store PDF for later download via GET request
    const { storePdf } = await import('../utils/store');
    storePdf(downloadId, Buffer.from(compressedBase64, 'base64'), outputName);

    console.log(`Compress-PDF: Successfully compressed ${file.name}. Base64 length: ${compressedBase64.length}, DownloadId: ${downloadId}`);

    return NextResponse.json({
        base64: compressedBase64,
        fileName: outputName,
        contentType: 'application/pdf',
        downloadId: downloadId
    });
  } catch (err: any) {
    console.error('compress-pdf error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
