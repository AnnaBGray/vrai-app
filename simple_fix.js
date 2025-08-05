const fs = require('fs');

// Read the file
let content = fs.readFileSync('admin-submission-detail.html', 'utf8');

// Fix the broken line and add debugging
content = content.replace(
    '// Prepare file name and path\\n                \\n                // Get user ID and add debugging\\n                const userId = sessionData.session.user.id;\\n                console.log("User ID for upload:", userId);\\n                console.log("User ID type:", typeof userId);\\n                console.log("User ID length:", userId.length);',
    '// Prepare file name and path\n                \n                // Get user ID and add debugging\n                const userId = sessionData.session.user.id;\n                console.log("User ID for upload:", userId);\n                console.log("User ID type:", typeof userId);\n                console.log("User ID length:", userId.length);'
);

// Update the metadata to use userId.toString()
content = content.replace(
    'owner: sessionData.session.user.id',
    'owner: userId.toString()'
);

// Write the fixed file
fs.writeFileSync('admin-submission-detail.html', content);
console.log('File fixed successfully!'); 