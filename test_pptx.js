const fs = require('fs');
const http = require('http');
const path = require('path');

const pdfPath = './test.pdf';
if (!fs.existsSync(pdfPath)) {
    console.error(`Error: Test PDF not found at ${pdfPath}`);
    process.exit(1);
}

const pdfBuffer = fs.readFileSync(pdfPath);
const boundary = 'boundary' + Date.now();
const filename = 'test_presentation.pdf';

const prefix = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
  `Content-Type: application/pdf\r\n\r\n`
);
const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
const body = Buffer.concat([prefix, pdfBuffer, suffix]);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/pdf-to-pptx',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
};

console.log('Sending PDF to local /api/pdf-to-pptx...');
const req = http.request(options, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(raw);
      if (json.downloadId) {
        console.log('SUCCESS!');
        console.log('Download ID:', json.downloadId);
        console.log('Output Filename:', json.fileName);
        console.log('Base64 Length:', json.base64 ? json.base64.length : 0);
      } else {
        console.log('FAILED - Response:', raw.substring(0, 500));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', raw.substring(0, 500));
    }
  });
});

req.on('error', err => console.error('Request error:', err.message));
req.write(body);
req.end();
