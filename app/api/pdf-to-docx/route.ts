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

    // Build multipart form to send to ConvertAPI
    const apiForm = new FormData();
    apiForm.append('File', file, file.name);

    const apiRes = await fetch('https://v2.convertapi.com/convert/pdf/to/docx', {
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

    // ConvertAPI returns base64-encoded file content
    const fileData = result?.Files?.[0];
    if (!fileData || !fileData.FileData) {
      return NextResponse.json({ error: 'No file returned from ConvertAPI' }, { status: 500 });
    }

    const docxBuffer = Buffer.from(fileData.FileData, 'base64');
    const outputName = file.name.replace(/\.pdf$/i, '.docx');

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${outputName}"`,
        'Content-Length': String(docxBuffer.length),
      },
    });
  } catch (err: any) {
    console.error('pdf-to-docx error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
