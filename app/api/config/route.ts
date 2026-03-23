import { NextResponse } from 'next/server';

/**
 * Returns RapidAPI credentials to the browser so it can call the API directly.
 * This makes the YouTube CDN URLs IP-locked to the USER's IP (not Vercel's),
 * allowing the browser to then download directly without CORS issues.
 * 
 * Note: the RapidAPI key is already rate-limited by the RapidAPI plan,
 * so exposing it here has the same risk profile as using it server-side.
 */
export async function GET() {
  const apiKey = process.env.RAPID_API_KEY;
  const apiHost = process.env.RAPID_API_HOST;

  if (!apiKey || !apiHost) {
    return NextResponse.json(
      { error: true, message: 'API credentials not configured.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ apiKey, apiHost });
}
