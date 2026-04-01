import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image_file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    
    // For development/initial setup: If no key is provided, return a friendly error or mock
    if (!apiKey) {
       console.error("Remove.bg API key is missing from environment variables.");
       return NextResponse.json({ 
         error: 'Remove.bg API key not configured. Please add REMOVE_BG_API_KEY to your .env file.' 
       }, { status: 500 });
    }

    const removeBgForm = new FormData();
    removeBgForm.append('image_file', file);
    removeBgForm.append('size', 'auto'); // Automatically determine size based on credits

    const apiRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: removeBgForm,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Remove.bg error:', errText);
      try {
        const errJson = JSON.parse(errText);
        return NextResponse.json({ error: errJson.errors?.[0]?.title || 'Removal failed' }, { status: apiRes.status });
      } catch {
        return NextResponse.json({ error: 'Background removal failed' }, { status: apiRes.status });
      }
    }

    const imageBuffer = await apiRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${file.name.split('.')[0]}_no_bg.png"`,
      },
    });
  } catch (err: any) {
    console.error('remove-bg error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
