import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { storeFile } from '../utils/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    // If 'files' not found, try single 'file' for backward compatibility or simple cases
    let images = files.length > 0 ? files : [formData.get('file') as File];
    images = images.filter(f => !!f);

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images uploaded' }, { status: 400 });
    }

    console.log(`JPG-to-PDF: Processing ${images.length} images`);

    const pdfDoc = await PDFDocument.create();

    for (const imageFile of images) {
      let arrayBuffer = await imageFile.arrayBuffer();
      let imageBytes = new Uint8Array(arrayBuffer);
      
      let embeddedImage;
      const contentType = imageFile.type;

      try {
        if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else if (contentType === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          // Use sharp to convert other formats (like webp) to jpeg
          console.log(`JPG-to-PDF: Converting ${contentType} to JPEG using sharp`);
          const sharp = (await import('sharp')).default;
          const jpegBuffer = await sharp(imageBytes).jpeg().toBuffer();
          imageBytes = new Uint8Array(jpegBuffer);
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
      } catch (embedError) {
        console.error(`JPG-to-PDF: Failed to embed ${imageFile.name}:`, embedError);
        continue; // Skip failed images or throw? Let's skip for robustness.
      }

      if (embeddedImage) {
        const { width, height } = embeddedImage.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }
    }

    if (pdfDoc.getPageCount() === 0) {
      throw new Error('No images could be embedded in the PDF');
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    
    const downloadId = crypto.randomUUID();
    const baseName = images[0].name.replace(/\.[^/.]+$/, "");
    const outputName = images.length > 1 ? `${baseName}_multiple.pdf` : `${baseName}.pdf`;

    storeFile(downloadId, pdfBuffer, outputName);

    console.log(`JPG-to-PDF: Conversion successful. Output: ${outputName}, DownloadId: ${downloadId}`);

    return NextResponse.json({
      fileName: outputName,
      downloadId: downloadId,
      pageCount: pdfDoc.getPageCount()
    });

  } catch (err: any) {
    console.error('JPG-to-PDF Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
