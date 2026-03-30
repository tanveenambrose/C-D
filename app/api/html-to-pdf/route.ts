import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { html, fileName } = await req.json();

    if (!html) {
      return NextResponse.json({ error: 'No HTML provided' }, { status: 400 });
    }

    const secret = process.env.CONVERT_API_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
    }

    // Wrap HTML in a basic document if it's just a fragment
    const fullHtml = html.includes('<html') 
      ? html 
      : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

    // Build multipart form to send to ConvertAPI
    const apiForm = new FormData();
    const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
    apiForm.append('File', htmlBlob as any, 'document.html');

    const apiRes = await fetch('https://v2.convertapi.com/convert/html/to/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
      body: apiForm,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('ConvertAPI HTML to PDF error:', errText);
      return NextResponse.json({ error: 'Conversion failed: ' + errText }, { status: 500 });
    }

    const result = await apiRes.json();
    const fileData = result?.Files?.[0];

    if (!fileData || !fileData.FileData) {
      return NextResponse.json({ error: 'No file returned from ConvertAPI' }, { status: 500 });
    }

    const pdfBuffer = Buffer.from(fileData.FileData, 'base64');
    const outputName = (fileName || 'document').replace(/\.[^/.]+$/, "") + '.pdf';
    const downloadId = crypto.randomUUID();

    // Store PDF for later download via GET request using the shared utility
    const { storePdf } = await import('../utils/store');
    storePdf(downloadId, pdfBuffer, outputName);

    return NextResponse.json({
      success: true,
      downloadId: downloadId,
      fileName: outputName,
      base64: fileData.FileData
    });
  } catch (err: any) {
    console.error('html-to-pdf error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
