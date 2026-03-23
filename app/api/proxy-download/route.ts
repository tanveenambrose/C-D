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
    const userIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const urlObj = new URL(videoUrl);
    const rangeHeader = request.headers.get('range');
    
    const fetchHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${urlObj.protocol}//${urlObj.hostname}/`,
      'Origin': `${urlObj.protocol}//${urlObj.hostname}`,
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'video',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    if (userIp) {
      fetchHeaders['X-Forwarded-For'] = userIp;
      fetchHeaders['X-Real-IP'] = userIp.split(',')[0].trim();
    }

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); 

    const response = await fetch(videoUrl, { 
      headers: fetchHeaders,
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);

    if (!response.ok && response.status !== 206) {
      console.error(`[Proxy] Upstream error: ${response.status} for ${videoUrl.substring(0, 40)}...`);
      
      if (response.status === 403 || response.status === 401) {
        return new Response(JSON.stringify({ 
          error: "Permission denied by video server on this cloud region.",
          solution: "The video server is blocking this download. Use the Backup Link (↗️ icon) next to the quality button to open it directly.",
          directUrl: videoUrl
        }), { status: response.status });
      }
      
      return new Response(JSON.stringify({ error: `Video server returned error ${response.status}.` }), { status: 502 });
    }

    const mimeType = MIME_MAP[ext] || `video/${ext}`;

    const safeBaseAscii = filename
      .replace(/[^\x00-\x7F]/g, "") 
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
        message: error.message,
        url: videoUrl
      }), 
      { status: isTimeout ? 504 : 500 }
    );
  }
}




