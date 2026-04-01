import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { html, fileName } = await req.json();

    if (!html) {
      return NextResponse.json({ error: 'No HTML content provided' }, { status: 400 });
    }

    const secret = process.env.CONVERT_API_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
    }

    // Step 1: HTML to DOCX (High Fidelity)
    const htmlToDocxForm = new FormData();
    const htmlBlob = new Blob([html], { type: 'text/html' });
    htmlToDocxForm.append('File', htmlBlob, 'edit.html');
    htmlToDocxForm.append('StoreFile', 'true');

    const htmlRes = await fetch('https://v2.convertapi.com/convert/html/to/docx', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
      body: htmlToDocxForm
    });

    if (!htmlRes.ok) {
      const errText = await htmlRes.text();
      console.error('ConvertAPI HTML to DOCX error:', errText);
      return NextResponse.json({ error: 'HTML to Word failed: ' + errText }, { status: 500 });
    }

    const docxResult = await htmlRes.json();
    const docxUrl = docxResult?.Files?.[0]?.Url;

    if (!docxUrl) {
      return NextResponse.json({ error: 'No Word file URL returned from ConvertAPI' }, { status: 500 });
    }

    // Step 2: DOCX to PDF (High Fidelity Fixed Reconstruction)
    const docxToPdfUrl = `https://v2.convertapi.com/convert/docx/to/pdf?File=${encodeURIComponent(docxUrl)}&FixedLayout=true`;

    const pdfRes = await fetch(docxToPdfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      }
    });

    if (!pdfRes.ok) {
        const errText = await pdfRes.text();
        console.error('ConvertAPI DOCX to PDF error:', errText);
        return NextResponse.json({ error: 'Word to PDF failed: ' + errText }, { status: 500 });
    }

    const pdfResult = await pdfRes.json();
    const pdfBase64 = pdfResult?.Files?.[0]?.FileData;

    if (!pdfBase64) {
      return NextResponse.json({ error: 'No PDF data returned' }, { status: 500 });
    }

    const outputName = fileName.replace(/\.[^/.]+$/, "") + "_updated.pdf";
    const downloadId = crypto.randomUUID();

    // Store PDF for later download
    const { storePdf } = await import('../utils/store');
    storePdf(downloadId, Buffer.from(pdfBase64, 'base64'), outputName);

    return NextResponse.json({
      success: true,
      fileName: outputName,
      downloadId: downloadId
    });
  } catch (err: any) {
    console.error('save-word-edit error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
