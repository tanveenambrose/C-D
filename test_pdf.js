const fs = require('fs');
const https = require('https');
const path = require('path');

const pdfBuffer = fs.readFileSync('./public/demo/TIN - Tanveen.pdf');
const apiKey = 'HZKKoKfXXsOAqp8D9FGLi0jcCnNGTeny';

// Build raw multipart body manually
const boundary = 'boundary' + Date.now();
const filename = 'TIN - Tanveen.pdf';

const prefix = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="File"; filename="${filename}"\r\n` +
  `Content-Type: application/pdf\r\n\r\n`
);
const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
const body = Buffer.concat([prefix, pdfBuffer, suffix]);

const options = {
  hostname: 'v2.convertapi.com',
  path: '/convert/pdf/to/docx',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
};

console.log('Sending PDF to ConvertAPI...');
const req = https.request(options, (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const raw = Buffer.concat(chunks).toString();
    try {
      const json = JSON.parse(raw);
      if (json.Files && json.Files.length > 0) {
        const fileData = json.Files[0];
        fs.writeFileSync('./public/demo/output.docx', Buffer.from(fileData.FileData, 'base64'));
        console.log('SUCCESS! File saved as output.docx');
        console.log('Original name:', fileData.FileName);
      } else {
        console.log('ERROR - Response:', raw.substring(0, 500));
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
