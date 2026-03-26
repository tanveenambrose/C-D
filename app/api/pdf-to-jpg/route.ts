import { NextRequest, NextResponse } from 'next/server';
import { storeFile } from '../utils/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const CONVERT_API_SECRET = process.env.CONVERT_API_SECRET;
    if (!CONVERT_API_SECRET) {
      return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
    }

    console.log(`PDF-to-JPG: Starting conversion for ${file.name}. Type: ${file.type}, Size: ${file.size}`);

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer) throw new Error('Failed to read file arrayBuffer');
    
    const base64File = Buffer.from(arrayBuffer).toString('base64');
    console.log(`PDF-to-JPG: File encoded to base64. Length: ${base64File.length}`);

    // ConvertAPI PDF to JPG
    // Note: If multiple pages, it returns a ZIP of JPGs by default
    const apiUrl = `https://v2.convertapi.com/convert/pdf/to/jpg?Secret=${CONVERT_API_SECRET}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Parameters: [
          { Name: 'File', FileValue: { Name: file.name, Data: base64File } },
          { Name: 'StoreFile', Value: false }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ConvertAPI Error:', errorData);
      return NextResponse.json({ error: errorData.Message || 'Conversion failed' }, { status: response.status });
    }

    const result = await response.json();
    console.log('PDF-to-JPG: ConvertAPI Full Result:', JSON.stringify(result, null, 2));

    if (!result.Files || result.Files.length === 0) {
      console.error('PDF-to-JPG: No files in ConvertAPI result', result);
      return NextResponse.json({ error: 'Conversion service returned no files' }, { status: 500 });
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    let finalBuffer: Buffer;
    let finalOutputName: string;
    let finalContentType: string;

    if (result.Files.length === 1) {
      // Single page PDF
      const fileData = result.Files[0];
      const outputBase64 = fileData.FileData;
      if (!outputBase64) throw new Error('Conversion data is missing for single page');
      
      finalBuffer = Buffer.from(outputBase64, 'base64');
      finalOutputName = `${baseName}.jpg`;
      finalContentType = 'image/jpeg';
    } else {
      // Multi-page PDF - package as ZIP
      console.log(`PDF-to-JPG: Multi-page result detected (${result.Files.length} pages). Packaging into ZIP.`);
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const f of result.Files) {
        if (f.FileData) {
          zip.file(f.FileName, f.FileData, { base64: true });
        }
      }
      finalBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      finalOutputName = `${baseName}.zip`;
      finalContentType = 'application/zip';
    }

    const downloadId = crypto.randomUUID();

    // Store for later download
    storeFile(downloadId, finalBuffer, finalOutputName);

    console.log(`PDF-to-JPG: Successfully processed ${file.name}. Result: ${finalOutputName}, DownloadId: ${downloadId}`);

    return NextResponse.json({
        base64: result.Files[0].FileData, // Return first page for preview
        fileName: finalOutputName,
        contentType: finalContentType,
        downloadId: downloadId
    });
  } catch (err: any) {
    console.error('pdf-to-jpg error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
