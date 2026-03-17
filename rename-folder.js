
const fs = require('fs');
const path = require('path');

try {
  const oldPath = 'D:\\Convert & Downloader\\C&D';
  const newPath = 'D:\\Convert & Downloader\\CD';
  
  if (fs.existsSync(oldPath)) {
    console.log(`Renaming ${oldPath} to ${newPath}`);
    fs.renameSync(oldPath, newPath);
    console.log('Success!');
  } else {
    console.log('Path not found.');
  }
} catch (error) {
  console.error('Error:', error.message);
}
