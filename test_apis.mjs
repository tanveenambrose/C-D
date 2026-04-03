// Quick test - runs against the live dev server
const fileBuf = (await import('fs')).readFileSync('./test_video.mp4');

async function testEndpoint(name, url, format = 'webm') {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    const blob = new Blob([fileBuf], { type: 'video/mp4' });
    const fd = new FormData();
    fd.append('file', blob, 'test_video.mp4');
    fd.append('format', format);

    const res = await fetch(url, { method: 'POST', body: fd });
    const ct = res.headers.get('content-type') || '';
    
    if (res.ok) {
      if (ct.includes('application/json')) {
        const json = await res.json();
        console.log(`   ✅ HTTP ${res.status} OK (JSON):`, JSON.stringify(json).slice(0, 200));
      } else {
        const buf = await res.arrayBuffer();
        console.log(`   ✅ HTTP ${res.status} OK (Binary): ${buf.byteLength} bytes | Content-Type: ${ct}`);
      }
    } else {
      const txt = await res.text();
      let parsed;
      try { parsed = JSON.parse(txt); } catch { parsed = txt; }
      console.log(`   ❌ HTTP ${res.status} FAILED:`, typeof parsed === 'object' ? JSON.stringify(parsed) : parsed.slice(0, 300));
    }
  } catch (e) {
    console.log(`   ❌ NETWORK ERROR:`, e.message);
  }
}

await testEndpoint('Local Server CPU (/api/video/local)', 'http://localhost:3000/api/video/local', 'mp4');
await testEndpoint('Local Server CPU (/api/video/local) → WebM', 'http://localhost:3000/api/video/local', 'webm');
await testEndpoint('Cloud API (/api/video/cloud)', 'http://localhost:3000/api/video/cloud', 'mp4');
