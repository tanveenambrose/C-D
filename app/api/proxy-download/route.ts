export const runtime = 'edge';

// Map file extensions to their correct MIME types
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
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    // Use a longer timeout for the initial request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for connection

    const response = await fetch(videoUrl, { 
      headers: fetchHeaders,
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);

    if (!response.ok && response.status !== 206) {
      console.error(`[Proxy] Upstream error: ${response.status} for ${videoUrl}`);
      return new Response(JSON.stringify({ error: `Upstream error: ${response.status}. Please try another quality.` }), { status: 502 });
    }

    const mimeType = MIME_MAP[ext] || `video/${ext}`;

    // Sanitize the filename
    const safeBase = filename
      .replace(/[^\w\s\-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 80) || 'video';

    const downloadName = `${safeBase}.${ext}`;
    const encodedName = encodeURIComponent(downloadName);

    const headers = new Headers();
    // Modern Content-Disposition with UTF-8 support
    headers.set('Content-Disposition', `attachment; filename="${downloadName}"; filename*=UTF-8''${encodedName}`);
    headers.set('Content-Type', mimeType);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'private, no-transform, max-age=0');
    
    // Forward essential headers
    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    
    const contentRange = response.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);
    
    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);
    else headers.set('Accept-Ranges', 'bytes');

    // Return the response directly as a stream
    return new Response(response.body, { 
      status: response.status, 
      headers 
    });

  } catch (error: any) {
    console.error('[Proxy Download] Error:', error);
    const isTimeout = error.name === 'AbortError';
    return new Response(
      JSON.stringify({ 
        error: isTimeout ? 'Connection timed out' : 'Failed to proxy video download.',
        details: error.message 
      }), 
      { status: isTimeout ? 504 : 500 }
    );
  }
}

