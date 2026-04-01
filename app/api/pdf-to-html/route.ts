import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const secret = process.env.CONVERT_API_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
    }

    // Build multipart form to send to ConvertAPI for PDF to HTML
    // We use FixedLayout: true and Wysiwyg: true to ensure perfect layout preservation
    const apiForm = new FormData();
    apiForm.append('File', file, file.name);
    
    // ConvertAPI PDF to HTML Parameters
    const params = {
      'FixedLayout': 'true',
      'Wysiwyg': 'true',
      'EmbedImages': 'true',
      'EmbedFonts': 'true',
      'EmbedCss': 'true',
      'Scripts': 'false', // Disable background scripts to keep it clean for editing
      'InlineCss': 'true'
    };

    const url = new URL('https://v2.convertapi.com/convert/pdf/to/html');
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const apiRes = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
      body: apiForm,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('ConvertAPI error:', errText);
      return NextResponse.json({ error: 'Conversion failed: ' + errText }, { status: 500 });
    }

    const result = await apiRes.json();
    const fileData = result?.Files?.[0];

    if (!fileData || !fileData.FileData) {
      return NextResponse.json({ error: 'No HTML file returned from ConvertAPI' }, { status: 500 });
    }

    // ConvertAPI returns base64-encoded file content
    const htmlContent = Buffer.from(fileData.FileData, 'base64').toString('utf8');

    return NextResponse.json({
      success: true,
      html: htmlContent,
      fileName: file.name
    });
  } catch (err: any) {
    console.error('pdf-to-html error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
