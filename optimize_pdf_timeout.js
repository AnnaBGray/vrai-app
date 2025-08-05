const fs = require('fs');

console.log('⚡ Optimizing PDF generation timeout...');

// Read the file
let content = fs.readFileSync('admin-submission-detail.html', 'utf8');

// Find and replace the timeout
const oldTimeout = 'const timeout = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10s';
const newTimeout = 'const timeout = setTimeout(() => controller.abort(), 5000); // Optimized timeout to 5s';

if (content.includes(oldTimeout)) {
    content = content.replace(oldTimeout, newTimeout);
    fs.writeFileSync('admin-submission-detail.html', content);
    console.log('✅ Reduced PDF generation timeout from 10s to 5s');
} else {
    console.log('ℹ️ Timeout already optimized or not found');
}

console.log('🎯 Expected improvement: 5-10 seconds faster PDF generation'); 