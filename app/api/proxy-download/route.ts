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
    // Forward the Range header from the browser if present (crucial for large file downloads)
    const rangeHeader = request.headers.get('range');
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'https://www.tiktok.com/',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(videoUrl, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      return new Response(JSON.stringify({ error: `Upstream error: ${response.status}` }), { status: 502 });
    }

    // Always use the MIME type we know is correct for this extension
    const mimeType = MIME_MAP[ext] || `video/${ext}`;

    // Sanitize the filename — keep only safe characters
    const safeBase = filename
      .replace(/[^\w\s\-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 60) || 'video';

    const downloadName = `${safeBase}.${ext}`;
    const encodedName = encodeURIComponent(downloadName);

    const headers = new Headers();
    // Force download with the correct filename and extension
    // Keep the header simple to avoid browser parser bugs that strip extensions
    headers.set('Content-Disposition', `attachment; filename="${downloadName}"`);
    headers.set('Content-Type', mimeType);
    headers.set('Cache-Control', 'no-store');
    
    // Forward size and range headers to support resumable downloads and progress bars
    if (response.headers.has('content-length')) {
      headers.set('Content-Length', response.headers.get('content-length')!);
    }
    if (response.headers.has('content-range')) {
      headers.set('Content-Range', response.headers.get('content-range')!);
    }
    if (response.headers.has('accept-ranges')) {
      headers.set('Accept-Ranges', response.headers.get('accept-ranges')!);
    } else {
      headers.set('Accept-Ranges', 'bytes');
    }

    // Stream the body directly back
    // using the exact status code from the CDN (200 or 206 for ranges)
    return new Response(response.body, { 
      status: response.status, 
      headers 
    });

  } catch (error) {
    console.error('[Proxy Download] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to proxy video download.' }), { status: 500 });
  }
}
