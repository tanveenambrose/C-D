export const runtime = 'edge';

const MIME_MAP: Record<string, string> = {
  mp4:  'video/mp4',
  webm: 'video/webm',
  mkv:  'video/x-matroska',
  mov:  'video/quicktime',
  avi:  'video/x-msvideo',
  mp3:  'audio/mpeg',
  m4a:  'audio/mp4',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  flac: 'audio/flac',
  aac:  'audio/aac',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'video';
  const ext = (searchParams.get('ext') || 'mp4').toLowerCase().replace(/^\./, '');

  if (!videoUrl) {
    return new Response(JSON.stringify({ error: 'No URL provided' }), { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get('range');
    const userAgent = request.headers.get('user-agent')
      || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    const fetchHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      // Critical: YouTube CDN tokens expect Referer to be youtube.com
      'Referer': 'https://www.youtube.com/',
      'Origin': 'https://www.youtube.com',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const controller = new AbortController();
    // Vercel Edge functions can stream indefinitely, but let's give the initial fetch a generous timeout to connect
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(videoUrl, {
      headers: fetchHeaders,
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    clearTimeout(timeoutId);

    if (!response.ok && response.status !== 206) {
      console.error(`[Proxy] Upstream ${response.status}: ${videoUrl.substring(0, 80)}`);
      return new Response(
        JSON.stringify({ error: `CDN returned ${response.status}. The video link may have expired. Please fetch again.` }),
        { status: response.status }
      );
    }

    const mimeType = MIME_MAP[ext] || `video/${ext}`;

    const safeBase = filename
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^\w\d\-_]/g, '_')
      .substring(0, 60) || 'video';

    const downloadName = `${safeBase}.${ext}`;
    const encodedName = encodeURIComponent(downloadName);

    const resHeaders = new Headers({
      'Content-Disposition': `attachment; filename="${downloadName}"; filename*=UTF-8''${encodedName}`,
      'Content-Type': mimeType,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    });

    const contentLength = response.headers.get('content-length');
    if (contentLength) resHeaders.set('Content-Length', contentLength);

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) resHeaders.set('Accept-Ranges', acceptRanges);

    const contentRange = response.headers.get('content-range');
    if (contentRange) resHeaders.set('Content-Range', contentRange);

    // Stream the response body directly — Edge runtime has no timeout limit when streaming
    return new Response(response.body, {
      status: response.status,
      headers: resHeaders,
    });

  } catch (error: any) {
    console.error('[Proxy Download] Error:', error.message);
    const isTimeout = error.name === 'AbortError';
    return new Response(
      JSON.stringify({ error: isTimeout ? 'Connection to CDN timed out' : `Proxy failed: ${error.message}` }),
      { status: isTimeout ? 504 : 500 }
    );
  }
}
