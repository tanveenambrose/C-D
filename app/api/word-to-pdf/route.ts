import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('Word-to-PDF: No file provided in FormData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const secret = process.env.CONVERT_API_SECRET;
    if (!secret) {
      console.error('Word-to-PDF: Missing CONVERT_API_SECRET');
      return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
    }

    // Determine correct endpoint based on file extension
    const extension = file.name?.split('.').pop()?.toLowerCase() || '';
    const formatFrom = (extension === 'doc') ? 'doc' : 'docx';
    const apiUrl = `https://v2.convertapi.com/convert/${formatFrom}/to/pdf`;

    const apiForm = new FormData();
    apiForm.append('File', file, file.name);

    console.log(`Word-to-PDF: Converting ${file.name} via ${apiUrl} (${file.size} bytes)`);

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
      body: apiForm,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error(`Word-to-PDF: ConvertAPI returned error (${apiRes.status}):`, errText);
      return NextResponse.json({ error: `Conversion failed: ${errText}` }, { status: 500 });
    }

    const result = await apiRes.json();
    const fileData = result?.Files?.[0];

    if (!fileData || !fileData.FileData) {
      console.error('Word-to-PDF: No file returned from ConvertAPI');
      return NextResponse.json({ error: 'No file returned from conversion service' }, { status: 500 });
    }

    const pdfBase64 = fileData.FileData; // ConvertAPI already returns base64
    const outputName = file.name.replace(/\.docx?$/i, '.pdf');
    const downloadId = crypto.randomUUID();

    // Store PDF for later download via GET request
    const { storePdf } = await import('../utils/store');
    storePdf(downloadId, Buffer.from(pdfBase64, 'base64'), outputName);

    console.log(`Word-to-PDF: Successfully converted ${file.name}. Base64 length: ${pdfBase64.length}, DownloadId: ${downloadId}`);

    return NextResponse.json({
        base64: pdfBase64,
        fileName: outputName,
        contentType: 'application/pdf',
        downloadId: downloadId
    });
  } catch (err: any) {
    console.error('word-to-pdf error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
