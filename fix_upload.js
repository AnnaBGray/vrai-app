const fs = require('fs');

// Read the file
let content = fs.readFileSync('admin-submission-detail.html', 'utf8');

// Replace the broken section with the correct one
const oldSection = `// Prepare file name and path
                const fileName = \`report-\${reportData.id}.pdf\`;
                console.log(\`Uploading PDF directly to Supabase Storage as: \${fileName}\`);
                
                // Upload directly to Supabase Storage from frontend
                const { data: uploadData, error: uploadError } = await window.supabaseClient
                    .storage
                    .from('reports')
                    .upload(fileName, pdfBlob, {
                        contentType: 'application/pdf',
                        upsert: true,
                        metadata: {
                            owner: sessionData.session.user.id
                        }
                    });`;

const newSection = `// Prepare file name and path
                const fileName = \`report-\${reportData.id}.pdf\`;
                console.log(\`Uploading PDF directly to Supabase Storage as: \${fileName}\`);
                
                // Get user ID and add debugging
                const userId = sessionData.session.user.id;
                console.log('User ID for upload:', userId);
                console.log('User ID type:', typeof userId);
                console.log('User ID length:', userId.length);
                
                // Upload directly to Supabase Storage from frontend
                const { data: uploadData, error: uploadError } = await window.supabaseClient
                    .storage
                    .from('reports')
                    .upload(fileName, pdfBlob, {
                        contentType: 'application/pdf',
                        upsert: true,
                        metadata: {
                            owner: userId.toString()
                        }
                    });`;

content = content.replace(oldSection, newSection);

// Write the fixed file
fs.writeFileSync('admin-submission-detail.html', content);
console.log('File updated successfully!'); 