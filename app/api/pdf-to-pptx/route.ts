import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('PDF-to-PPTX: No file provided in FormData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const secret = process.env.CONVERT_API_SECRET;
    if (!secret) {
      console.error('PDF-to-PPTX: Missing CONVERT_API_SECRET');
      return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
    }

    // ConvertAPI Endpoint for PDF to PPTX
    const apiUrl = `https://v2.convertapi.com/convert/pdf/to/pptx`;

    const apiForm = new FormData();
    apiForm.append('File', file, file.name);
    // Explicitly set parameters if needed (e.g., OcrMode: 'auto')
    // apiForm.append('OcrMode', 'auto');

    console.log(`PDF-to-PPTX: Converting ${file.name} via ${apiUrl} (${file.size} bytes)`);

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
      body: apiForm,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error(`PDF-to-PPTX: ConvertAPI returned error (${apiRes.status}):`, errText);
      return NextResponse.json({ error: `Conversion failed: ${errText}` }, { status: 500 });
    }

    const result = await apiRes.json();
    const fileData = result?.Files?.[0];

    if (!fileData || !fileData.FileData) {
      console.error('PDF-to-PPTX: No file returned from ConvertAPI');
      return NextResponse.json({ error: 'No file returned from conversion service' }, { status: 500 });
    }

    const pptxBase64 = fileData.FileData;
    const outputName = file.name.replace(/\.pdf$/i, '.pptx');
    const downloadId = crypto.randomUUID();

    // Store for later download via GET /api/download-file?id=...
    const { storeFile } = await import('../utils/store');
    storeFile(downloadId, Buffer.from(pptxBase64, 'base64'), outputName);

    console.log(`PDF-to-PPTX: Successfully converted ${file.name}. DownloadId: ${downloadId}`);

    return NextResponse.json({
        base64: pptxBase64,
        fileName: outputName,
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        downloadId: downloadId
    });
  } catch (err: any) {
    console.error('pdf-to-pptx error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
