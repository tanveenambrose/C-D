const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createDummyPdf(filename, text) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 500]);
  page.drawText(text, { x: 50, y: 250, size: 30, color: rgb(0, 0, 0) });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(__dirname, filename), pdfBytes);
  console.log('Created: ' + filename);
}

async function run() {
  await createDummyPdf('dummy1.pdf', 'This is Dummy PDF 1');
  await createDummyPdf('dummy2.pdf', 'This is Dummy PDF 2');
}

run();
