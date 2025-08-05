const fs = require('fs');

console.log('🔧 Removing duplicate script tag...');

// Read the file
let content = fs.readFileSync('admin-submission-detail.html', 'utf8');

// Count occurrences of the script tag
const scriptTag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
const occurrences = (content.match(new RegExp(scriptTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

console.log(`📊 Found ${occurrences} occurrences of Supabase script tag`);

if (occurrences > 1) {
    // Remove the last occurrence (duplicate)
    const lastIndex = content.lastIndexOf(scriptTag);
    if (lastIndex !== -1) {
        content = content.substring(0, lastIndex) + content.substring(lastIndex + scriptTag.length);
        fs.writeFileSync('admin-submission-detail.html', content);
        console.log('✅ Removed duplicate script tag');
    }
} else {
    console.log('ℹ️ No duplicates found');
}

console.log('🎯 Expected improvement: Faster page load'); 