/**
 * Admin Service Routes for Vrai Authentication System
 * Handles admin-only operations with proper Supabase authentication
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyxakkxotjkdsjvbufiv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if service role key is available
if (!supabaseServiceKey) {
    console.error('❌ CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set!');
}

// Log Supabase configuration (without exposing the actual key)
console.log('Supabase Admin Configuration:', {
    url: supabaseUrl,
    keyConfigured: !!supabaseServiceKey,
    keyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
    env: process.env.NODE_ENV || 'development',
    vercelEnv: process.env.VERCEL_ENV || 'unknown'
});

// Create Supabase client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test the Supabase connection
supabaseAdmin.from('authentication_requests')
    .select('count', { count: 'exact', head: true })
    .then(({ data, error }) => {
        if (error) {
            console.error('❌ Supabase admin client test query failed:', error);
        } else {
            console.log('✅ Supabase admin client test query successful');
        }
    })
    .catch(err => {
        console.error('❌ Supabase admin client test query error:', err);
    });

// Configure multer for file uploads
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
        files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5
    },
    fileFilter: function (req, file, cb) {
        // Accept images and PDFs
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

// Middleware to verify admin access
async function verifyAdminAccess(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        
        // Verify the token and check if user is admin
        const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !userData) {
            console.error('Auth error:', authError);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        
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
        
        // Add user info to request for use in route handlers
        req.user = userData.user;
        req.isAdmin = true;
        
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ error: 'Internal server error during admin verification' });
    }
}

// Apply admin verification to all routes
router.use(verifyAdminAccess);

// Get all authentication requests for admin dashboard
router.get('/authentication-requests', async (req, res) => {
    try {
        console.log('Admin requesting all authentication requests...');
        
        // Check if service role key is available
        if (!supabaseServiceKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
            return res.status(500).json({ 
                error: 'Server configuration error', 
                message: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables'
            });
        }
        
        // Log the request headers for debugging (without exposing sensitive info)
        console.log('Request headers:', {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            contentType: req.headers['content-type']
        });
        
        try {
            const { data: requests, error, status } = await supabaseAdmin
                .from('authentication_requests')
                .select(`
                    id,
                    model_name,
                    status,
                    created_at,
                    updated_at,
                    human_readable_id,
                    user_email,
                    submission_id,
                    admin_notes,
                    report_url
                `)
                .order('updated_at', { ascending: false });
            
            console.log('Supabase response status:', status);
            
            if (error) {
                console.error('Error fetching authentication requests:', error);
                return res.status(500).json({ 
                    error: 'Failed to fetch authentication requests', 
                    details: error,
                    status: status
                });
            }
            
            console.log(`Successfully fetched ${requests?.length || 0} authentication requests for admin`);
            return res.status(200).json({ 
                success: true, 
                data: requests || [] 
            });
        } catch (supabaseError) {
            console.error('Supabase query error:', supabaseError);
            return res.status(500).json({ 
                error: 'Supabase query error', 
                message: supabaseError.message
            });
        }
        
    } catch (error) {
        console.error('Server error fetching authentication requests:', error);
        return res.status(500).json({ error: `Server error: ${error.message}` });
    }
});

// Debug endpoint to check admin API configuration
router.get('/debug', async (req, res) => {
    try {
        // Return configuration info (without exposing the actual key)
        return res.status(200).json({
            success: true,
            config: {
                supabaseUrl: supabaseUrl,
                serviceKeyConfigured: !!supabaseServiceKey,
                serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
                environment: process.env.NODE_ENV || 'development'
            }
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        return res.status(500).json({ error: `Server error: ${error.message}` });
    }
});

// Upload PDF report endpoint
router.post('/upload-pdf', upload.single('pdfFile'), async (req, res) => {
    try {
        // Get file data and parameters
        const pdfFile = req.file;
        const submissionId = req.body.submissionId;
        
        if (!pdfFile || !submissionId) {
            return res.status(400).json({ error: 'Bad Request: Missing file or submission ID' });
        }
        
        console.log('PDF upload request received:', pdfFile.originalname, 'for submission:', submissionId);
        
        // Read the file from disk
        const fileBuffer = fs.readFileSync(pdfFile.path);
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
        fs.unlinkSync(pdfFile.path);
        
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
});

module.exports = router; 