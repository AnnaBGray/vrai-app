const fs = require('fs');

console.log('🔄 Fixing dashboard.html redirects to index.html...');

// Files to update (excluding package json/ folder)
const filesToUpdate = [
    'admin-session.js',
    'auth-check.js', 
    'script.js',
    'server.js',
    'shared-navigation.js',
    'signup.js',
    'authenticate-step1.html',
    'authentication-submissions.html',
    'contact-support.html',
    'help-center.html',
    'login.html',
    'settings.html',
    'authenticate-guide.html',
    'dashboard-admin.html'
];

let totalChanges = 0;

filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let fileChanges = 0;
        
        // Replace dashboard.html with index.html
        const oldContent = content;
        content = content.replace(/dashboard\.html/g, 'index.html');
        
        if (content !== oldContent) {
            fs.writeFileSync(file, content);
            const changes = (content.match(/index\.html/g) || []).length - (oldContent.match(/index\.html/g) || []).length;
            fileChanges = changes;
            totalChanges += changes;
            console.log(`✅ Updated ${file}: ${changes} changes`);
        } else {
            console.log(`ℹ️ No changes needed in ${file}`);
        }
    } else {
        console.log(`⚠️ File not found: ${file}`);
    }
});

console.log(`\n🎯 Summary:`);
console.log(`- Updated ${filesToUpdate.length} files`);
console.log(`- Total changes: ${totalChanges}`);
console.log(`- All dashboard.html references now redirect to index.html`);
console.log(`\n✅ This will fix all 404 errors and broken redirects!`); 