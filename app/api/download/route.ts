import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: true, message: 'URL is required' }, { status: 400 });
    }

    const apiKey = process.env.RAPID_API_KEY;
    const apiHost = process.env.RAPID_API_HOST;

    if (!apiKey || !apiHost) {
      return NextResponse.json({ error: true, message: 'API credentials not configured on server.' }, { status: 500 });
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey,
      },
      body: JSON.stringify({ url }),
    };

    const response = await fetch(
      'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
      options
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: true, message: `API responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error('[Download API] Error:', err);
    return NextResponse.json(
      { error: true, message: 'An unexpected error occurred on the server.' },
      { status: 500 }
    );
  }
}
