const fs = require('fs');
const path = require('path');

async function testConvertAPI() {
  const secret = 'HZKKoKfXXsOAqp8D9FGLi0jcCnNGTeny';
  
  // create dummy docx file
  // fs.writeFileSync('dummy.txt', 'hello world'); // Original line, now commented/removed as per instruction

  const filePath = path.join(__dirname, 'public', 'demo', 'output.docx');
  const fileBuffer = fs.readFileSync(filePath);

  const formData = new FormData();
  const fileBlob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  formData.append('File', fileBlob, 'output.docx');

  try {
    const res = await fetch('https://v2.convertapi.com/convert/docx/to/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`
      },
      body: formData
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text.substring(0, 100)); // only first 100 chars
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testConvertAPI();
