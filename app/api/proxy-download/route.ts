export const runtime = 'edge';

/**
 * STRATEGY: Return a 302 redirect to the CDN URL.
 *
 * Problem: Vercel's datacenter IPs are blocked by YouTube's CDN (403),
 * and browser fetch() is blocked by CORS (no Access-Control-Allow-Origin header).
 *
 * Solution: This endpoint simply redirects the browser to the direct CDN URL.
 * The browser follows the redirect and downloads from the CDN using the USER's
 * own residential IP address, which was already authorized when the video URLs
 * were fetched.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new Response(JSON.stringify({ error: 'No URL provided' }), { status: 400 });
  }

  try {
    // Validate the URL is safe to redirect to
    const parsed = new URL(videoUrl);
    const allowedHosts = [
      'googlevideo.com', 'rr.googlevideo.com',
      'cdninstagram.com', 'fbcdn.net', 'fbsbx.com',
      'tiktokcdn.com', 'tiktokv.com', 'muscdn.com',
      'akamaized.net', 'cloudfront.net',
    ];
    const isAllowed = allowedHosts.some(h =>
      parsed.hostname === h || parsed.hostname.endsWith('.' + h)
    );

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Redirect target not whitelisted.' }), { status: 403 });
    }

    // 302 Redirect: browser follows this with its own IP → CDN allows it
    return new Response(null, {
      status: 302,
      headers: {
        'Location': videoUrl,
        'Cache-Control': 'no-store',
      },
    });

  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
  }
}
