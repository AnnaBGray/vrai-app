const fs = require('fs');

console.log('🖼️ Adding lazy loading to poster image...');

// Read the file
let content = fs.readFileSync('dashboard-admin.html', 'utf8');

// Find and replace the image tag
const oldImageTag = '<img src="./poster2.png" alt="Poster" class="absolute inset-0 w-full h-full object-cover" />';
const newImageTag = '<img src="./poster2.png" alt="Poster" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />';

if (content.includes(oldImageTag)) {
    content = content.replace(oldImageTag, newImageTag);
    fs.writeFileSync('dashboard-admin.html', content);
    console.log('✅ Added lazy loading to poster image');
} else {
    console.log('ℹ️ Image tag not found or already optimized');
}

console.log('🎯 Expected improvement: Faster initial page load'); 