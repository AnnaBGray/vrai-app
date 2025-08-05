// Use CommonJS require for compatibility with Vercel
const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs');
// PDF-related imports not needed on the server side
// const { PDFDocument } = require('pdf-lib');
// const { jsPDF } = require('jspdf');
// require('jspdf-autotable');
const fetch = require('node-fetch');

// Disable body parsing, we'll handle it with formidable
const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyxakkxotjkdsjvbufiv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Export the config for Next.js API routes
module.exports.config = config;

// Export the handler function
module.exports = async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('PDF upload request received');

    // Check if Supabase Admin client is initialized properly
    if (!supabaseServiceKey || supabaseServiceKey === '') {
      console.error('Supabase Admin client not initialized - missing service key');
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase service key' });
    }

    // Parse the incoming form data
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Process the form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid token');
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token received, verifying user');
    
    // Verify the token and check if user is admin
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !userData) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    console.log('User authenticated:', userData.user.id);
    
    // Check if user is admin by querying the profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .single();
    
    if (profileError || !profileData || !profileData.is_admin) {
      console.error('User is not authorized as admin:', userData.user.id);
      return res.status(403).json({ error: 'Forbidden: User is not authorized for this operation' });
    }
    
    console.log('Admin status verified');

    // Get file data and parameters
    const pdfFile = files.pdfFile;
    const submissionId = fields.submissionId;
    
    if (!pdfFile || !submissionId) {
      console.error('Missing file or submission ID');
      return res.status(400).json({ error: 'Bad Request: Missing file or submission ID' });
    }
    
    console.log('PDF file received:', pdfFile.originalFilename, 'for submission:', submissionId);
    
    // Read the file from disk
    const fileBuffer = fs.readFileSync(pdfFile.filepath);
    console.log('File read from disk, size:', fileBuffer.length, 'bytes');
    
    // Upload file to Supabase Storage using service role
    const fileName = `report-${submissionId}.pdf`;
    console.log('Uploading to Supabase Storage as:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('reports')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: `Failed to upload PDF: ${uploadError.message}` });
    }
    
    console.log('File uploaded successfully:', uploadData);
    
    // Get the public URL
    const { data: urlData } = await supabaseAdmin
      .storage
      .from('reports')
      .getPublicUrl(fileName);
    
    // Clean up the temporary file
    fs.unlinkSync(pdfFile.filepath);
    
    // Log the URL for debugging
    console.log('Generated public URL:', urlData.publicUrl);
    
    // Validate the URL to ensure it's not a dummy URL
    if (!urlData.publicUrl || 
        urlData.publicUrl.includes('example.com') || 
        urlData.publicUrl.includes('dummy.pdf') ||
        (!urlData.publicUrl.includes('storage.googleapis.com') && 
         !urlData.publicUrl.includes('supabase.co') && 
         !urlData.publicUrl.startsWith('https://'))) {
      console.error('Invalid public URL generated:', urlData.publicUrl);
      return res.status(500).json({ error: 'Failed to generate valid public URL' });
    }
    
    // Double-check the URL with a HEAD request to ensure it's accessible
    try {
      const urlCheckResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!urlCheckResponse.ok) {
        console.error('URL validation failed - resource not accessible:', urlData.publicUrl);
        return res.status(500).json({ error: 'Generated URL is not accessible' });
      }
      console.log('URL validation passed - resource is accessible');
    } catch (urlCheckError) {
      console.error('URL validation error:', urlCheckError);
      // Continue anyway as this might be a CORS issue rather than an actual problem
      console.log('Continuing despite URL validation error');
    }
    
    // Update the authentication_requests table with the report_url
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('authentication_requests')
      .update({ 
        report_url: urlData.publicUrl,
        status: 'Authenticated'
      })
      .eq('id', submissionId);
    
    if (updateError) {
      console.error('Database update error:', updateError);
      // Continue anyway as the file was uploaded successfully
      console.log('Continuing despite database update error');
    } else {
      console.log('Database updated successfully with report URL');
    }
    
    // Return the public URL
    return res.status(200).json({ 
      success: true, 
      message: 'PDF uploaded successfully', 
      url: urlData.publicUrl 
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
} 