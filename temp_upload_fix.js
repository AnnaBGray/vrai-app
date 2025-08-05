// Prepare file name and path
const fileName = `report-${reportData.id}.pdf`;
console.log(`Uploading PDF directly to Supabase Storage as: ${fileName}`);

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
    }); 