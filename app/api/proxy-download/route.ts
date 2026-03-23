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
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(videoUrl, { 
      headers: fetchHeaders,
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);

    if (!response.ok && response.status !== 206) {
      const errorMsg = `Upstream error: ${response.status} for ${videoUrl.substring(0, 30)}...`;
      console.error(`[Proxy] ${errorMsg}`);
      
      if (response.status === 403) {
        return new Response(JSON.stringify({ 
          error: "Permission denied by video server. This link might be IP-locked or expired.",
          solution: "Try refreshing the page and fetching the link again."
        }), { status: 403 });
      }
      
      return new Response(JSON.stringify({ error: `Video server returned error ${response.status}.` }), { status: 502 });
    }

    const mimeType = MIME_MAP[ext] || `video/${ext}`;

    // Robust ASCII filename for standard filename param, UTF-8 for filename*
    const safeBaseAscii = filename
      .replace(/[^\x00-\x7F]/g, "") // ASCII only
      .replace(/[^\w\d\-\_]/g, "_")
      .substring(0, 40) || 'video';
    
    const safeBaseFull = filename
       .replace(/[^\w\s\-]/g, '')
       .trim()
       .replace(/\s+/g, '_')
       .substring(0, 60) || 'video';

    const downloadNameAscii = `${safeBaseAscii}.${ext}`;
    const downloadNameFull = `${safeBaseFull}.${ext}`;
    const encodedNameFull = encodeURIComponent(downloadNameFull);

    const headers = new Headers();
    // Support all browsers with both params
    headers.set('Content-Disposition', `attachment; filename="${downloadNameAscii}"; filename*=UTF-8''${encodedNameFull}`);
    headers.set('Content-Type', mimeType);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    
    const acceptRanges = response.headers.get('accept-ranges') || 'bytes';
    headers.set('Accept-Ranges', acceptRanges);

    return new Response(response.body, { 
      status: response.status, 
      headers 
    });

  } catch (error: any) {
    console.error('[Proxy Download] Catch Error:', error);
    const isTimeout = error.name === 'AbortError';
    return new Response(
      JSON.stringify({ 
        error: isTimeout ? 'Request timed out' : 'Failed to connect to video server.',
        message: error.message 
      }), 
      { status: isTimeout ? 504 : 500 }
    );
  }
}


