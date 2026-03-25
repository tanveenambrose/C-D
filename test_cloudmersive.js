const fs = require('fs');

async function testCloudmersive() {
  const apiKey = 'dbb44d6a-72e9-4d6a-845f-57718e645a27';

  const formData = new FormData();
  const fileBlob = new Blob(['Hello Cloudmersive!'], { type: 'text/plain' });
  formData.append('inputFile', fileBlob, 'test.txt');

  try {
    console.log('Sending test request to Cloudmersive...');
    // We can use the txt to pdf endpoint for a simple test
    const res = await fetch('https://api.cloudmersive.com/convert/txt/to/pdf', {
      method: 'POST',
      headers: {
        'Apikey': apiKey
      },
      body: formData
    });

    if (res.ok) {
        const buffer = await res.arrayBuffer();
        fs.writeFileSync('test_output.pdf', Buffer.from(buffer));
        console.log('SUCCESS! test_output.pdf created.');
    } else {
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Error Response:', text);
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testCloudmersive();
