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

    // Step 1: PDF to DOCX (High Fidelity)
    const pdfToWordForm = new FormData();
    pdfToWordForm.append('File', file, file.name);

    const wordRes = await fetch('https://v2.convertapi.com/convert/pdf/to/docx?StoreFile=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
      body: pdfToWordForm,
    });

    if (!wordRes.ok) {
      const errText = await wordRes.text();
      console.error('ConvertAPI PDF to DOCX error:', errText);
      return NextResponse.json({ error: 'PDF to Word failed: ' + errText }, { status: 500 });
    }

    const wordResult = await wordRes.json();
    const wordFileUrl = wordResult?.Files?.[0]?.Url;

    if (!wordFileUrl) {
      return NextResponse.json({ error: 'No Word file URL returned from ConvertAPI' }, { status: 500 });
    }

    // Step 2: DOCX to HTML (Flow-Based but Styled)
    const wordToHtmlParams = {
        'File': wordFileUrl,
        'InlineImages': 'true',
        'EmbedCss': 'true',
        'FixedLayout': 'false', // Flow-based for easy editing
        'CleanHtml': 'false'    // Keep document-wide CSS like centering and borders
    };

    const htmlUrl = new URL('https://v2.convertapi.com/convert/docx/to/html');
    Object.entries(wordToHtmlParams).forEach(([key, value]) => htmlUrl.searchParams.append(key, value));

    const htmlRes = await fetch(htmlUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      }
    });

    if (!htmlRes.ok) {
      const errText = await htmlRes.text();
      console.error('ConvertAPI DOCX to HTML error:', errText);
      return NextResponse.json({ error: 'Word to HTML failed: ' + errText }, { status: 500 });
    }

    const htmlResult = await htmlRes.json();
    const htmlFileData = htmlResult?.Files?.[0]?.FileData;

    if (!htmlFileData) {
      return NextResponse.json({ error: 'No HTML data returned from ConvertAPI' }, { status: 500 });
    }

    const htmlContent = Buffer.from(htmlFileData, 'base64').toString('utf8');

    return NextResponse.json({
      success: true,
      html: htmlContent,
      fileName: file.name
    });
  } catch (err: any) {
    console.error('pdf-to-editable-html error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
