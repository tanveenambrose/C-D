const fs = require('fs');

async function testPdfToJpg() {
    console.log('Testing PDF to JPG conversion...');
    
    // Create a dummy PDF file for testing (even if it's just a text file named .pdf for the API to reject or accept)
    // Actually, I'll use a real PDF if available, or just send a dummy.
    const pdfPath = 'public/demo/TIN - Tanveen.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.error('Test PDF not found at', pdfPath);
        return;
    }

    const formData = new FormData();
    const fileContent = fs.readFileSync(pdfPath);
    const blob = new Blob([fileContent], { type: 'application/pdf' });
    formData.append('file', blob, 'TIN - Tanveen.pdf');

    console.log('Sending request to /api/pdf-to-jpg...');
    const res = await fetch('http://localhost:3000/api/pdf-to-jpg', {
        method: 'POST',
        body: formData
    });

    if (res.ok) {
        const data = await res.json();
        console.log('Conversion SUCCESS!');
        console.log('Download ID:', data.downloadId);
        console.log('File Name:', data.fileName);
        console.log('Content Type:', data.contentType);

        // Test the unified download endpoint
        console.log('Testing unified download endpoint...');
        const dlRes = await fetch(`http://localhost:3000/api/download-file?id=${data.downloadId}`);
        
        if (dlRes.ok) {
            const buffer = await dlRes.arrayBuffer();
            fs.writeFileSync('converted_result' + (data.contentType === 'application/zip' ? '.zip' : '.jpg'), Buffer.from(buffer));
            console.log('Download SUCCESS! File saved.');
        } else {
            console.log('Download FAILED! Status:', dlRes.status);
        }
    } else {
        const text = await res.text();
        console.log('Conversion FAILED! Status:', res.status);
        console.log('Response:', text);
    }

    // Cleanup
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
}

testPdfToJpg();
