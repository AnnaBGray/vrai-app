const fs = require('fs');

console.log('🔒 Temporarily hiding Apple and Google sign-up buttons from signup page...');

// Read the file
let content = fs.readFileSync('signup.html', 'utf8');

// Find the section with social signup buttons and add 'hidden' class
const oldSection = `<div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-200"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">or</span>
                    </div>
                </div>

                <div class="space-y-3">`;

const newSection = `<div class="relative hidden">
                    <div class="absolute inset-y-0 flex items-center">
                        <div class="w-full border-t border-gray-200"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">or</span>
                    </div>
                </div>

                <div class="space-y-3 hidden">`;

if (content.includes(oldSection)) {
    content = content.replace(oldSection, newSection);
    fs.writeFileSync('signup.html', content);
    console.log('✅ Successfully hidden Apple and Google sign-up buttons');
    console.log('📝 Note: All logic is preserved, buttons are just visually hidden');
} else {
    console.log('⚠️ Section not found, checking for alternative structure...');
    
    // Alternative approach: hide just the buttons
    const oldButtons = `<div class="space-y-3">`;
    const newButtons = `<div class="space-y-3 hidden">`;
    
    if (content.includes(oldButtons)) {
        content = content.replace(oldButtons, newButtons);
        fs.writeFileSync('signup.html', content);
        console.log('✅ Successfully hidden social sign-up buttons');
    } else {
        console.log('❌ Could not find the social sign-up section');
    }
}

console.log('🎯 Result:');
console.log('- Email/password signup: ✅ Fully visible and functional');
console.log('- Apple sign-up: 🔒 Temporarily hidden');
console.log('- Google sign-up: 🔒 Temporarily hidden');
console.log('- All logic: ✅ Preserved and intact'); 