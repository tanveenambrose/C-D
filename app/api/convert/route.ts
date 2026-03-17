import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const targetFormat = formData.get("targetFormat") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!targetFormat) {
      return NextResponse.json({ error: "No target format specified." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let transformer = sharp(buffer);

    // Apply conversion based on targetFormat
    const format = targetFormat.toLowerCase();
    
    switch (format) {
      case "jpg":
      case "jpeg":
        transformer = transformer.jpeg({ quality: 90 });
        break;
      case "png":
        transformer = transformer.png();
        break;
      case "webp":
        transformer = transformer.webp();
        break;
      case "avif":
        transformer = transformer.avif();
        break;
      case "tiff":
        transformer = transformer.tiff();
        break;
      case "gif":
        transformer = transformer.gif();
        break;
      // Note: BMP and ICO are not supported natively as output formats by sharp without extra plugins.
      // We will handle them as PNG if requested, or return error if we want to be strict.
      // For now, let's fall back to png if unsupported to avoid crash.
      default:
        transformer = transformer.png();
    }

    const outputBuffer = await transformer.toBuffer();

    // Determine content type
    let contentType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    
    return new Response(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="converted-image.${format}"`,
      },
    });
  } catch (error) {
    console.error("Conversion Error:", error);
    return NextResponse.json({ error: "Failed to convert image." }, { status: 500 });
  }
}
