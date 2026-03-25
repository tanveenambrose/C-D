const fs = require('fs');
const path = require('path');

async function testProxy() {
  const filePath = path.join(__dirname, 'public', 'demo', 'TIN - Tanveen (2).docx');
  if (!fs.existsSync(filePath)) {
    console.error('Test file not found:', filePath);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  // Simulate a File object as it would come from a browser
  const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  formData.append('file', blob, 'TIN - Tanveen (2).docx');

  console.log('Sending request to local proxy /api/word-to-pdf...');
  try {
    const res = await fetch('http://localhost:3000/api/word-to-pdf', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
        const data = await res.json();
        const pdfBuffer = Buffer.from(data.base64, 'base64');
        fs.writeFileSync('proxy_output.pdf', pdfBuffer);
        console.log('SUCCESS! proxy_output.pdf created. fileName:', data.fileName, 'size:', pdfBuffer.length);
    } else {
        const text = await res.text();
        console.log('FAILED! Status:', res.status);
        console.log('Response:', text);
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testProxy();
