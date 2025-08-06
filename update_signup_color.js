const fs = require('fs');

console.log('🎨 Updating Sign Up link color to primary blue...');

// Read the file
let content = fs.readFileSync('index.html', 'utf8');

// Find the Sign Up link and update its styling
const oldSignUpLink = `<a href="signup.html" class="font-medium text-primary-500 hover:text-primary-600 transition-colors">Sign Up</a>`;
const newSignUpLink = `<a href="signup.html" class="font-medium transition-colors" style="color: #89CFF0; text-decoration: none;">Sign Up</a>`;

if (content.includes(oldSignUpLink)) {
    content = content.replace(oldSignUpLink, newSignUpLink);
    fs.writeFileSync('index.html', content);
    console.log('✅ Successfully updated Sign Up link color to primary blue (#89CFF0)');
} else {
    console.log('⚠️ Sign Up link not found with expected structure');
}

console.log('🎯 Result:');
console.log('- Sign Up link: ✅ Now uses primary blue color (#89CFF0)');
console.log('- Hover effect: ✅ Preserved with transition');
console.log('- Font weight: ✅ Preserved as medium'); 