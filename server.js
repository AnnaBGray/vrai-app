/**
 * Express Server for Vrai Registration System
 * Clean, production-ready server with static file serving
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Import routes
// const profileRoutes = require('./routes/profile'); // Removed - using direct avatar upload route below
const adminServiceRoutes = require('./admin-service');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
if (process.env.HELMET_ENABLED === 'true') {
    app.use(helmet({
        contentSecurityPolicy: false, // Disable for development
        crossOriginEmbedderPolicy: false
    }));
}

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use(express.static('.', {
    index: 'index.html',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Use admin service routes
app.use('/api/admin', adminServiceRoutes);

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

// In-memory user storage (in production, this would be a database)
const registeredUsers = new Map();

// In-memory authentication requests storage
const authenticationRequests = new Map(); // Key: email, Value: array of requests

// In-memory submissions storage for dashboard review
const allSubmissions = []; // Array to store all authentication submissions

// Note: Admin users are now managed through Supabase profiles table
// No hardcoded admin users in server memory

// Add sample authentication requests for Anna with status history
authenticationRequests.set('annabella.gray1980@gmail.com', [
    {
        id: 1,
        itemName: 'Louis Vuitton Neverfull MM',
        brand: 'Louis Vuitton',
        status: 'Authenticated',
        submittedAt: '2025-06-29T10:00:00Z',
        completedAt: '2025-06-29T15:30:00Z',
        statusHistory: [
            {
                status: 'Submitted',
                timestamp: '2025-06-29T10:00:00Z',
                note: 'Authentication request submitted'
            },
            {
                status: 'In Review',
                timestamp: '2025-06-29T11:30:00Z',
                note: 'Expert review in progress'
            },
            {
                status: 'Authenticated',
                timestamp: '2025-06-29T15:30:00Z',
                note: 'Authentication completed - Item verified as authentic'
            }
        ]
    },
    {
        id: 2,
        itemName: 'Chanel Classic Flap',
        brand: 'Chanel', 
        status: 'Authenticated',
        submittedAt: '2025-06-29T14:00:00Z',
        completedAt: '2025-06-30T09:15:00Z',
        statusHistory: [
            {
                status: 'Submitted',
                timestamp: '2025-06-29T14:00:00Z',
                note: 'Authentication request submitted'
            },
            {
                status: 'In Review',
                timestamp: '2025-06-29T16:45:00Z',
                note: 'Photos under expert review'
            },
            {
                status: 'Additional Photos Requested',
                timestamp: '2025-06-30T08:00:00Z',
                note: 'Please provide clearer photos of serial number'
            },
            {
                status: 'Authenticated',
                timestamp: '2025-06-30T09:15:00Z',
                note: 'Authentication completed - Genuine Chanel item confirmed'
            }
        ]
    },
    {
        id: 3,
        itemName: 'Hermès Birkin 35',
        brand: 'Hermès',
        status: 'Pending',
        submittedAt: '2025-06-30T11:00:00Z',
        statusHistory: [
            {
                status: 'Submitted',
                timestamp: '2025-06-30T11:00:00Z',
                note: 'Authentication request submitted'
            },
            {
                status: 'In Review',
                timestamp: '2025-06-30T14:30:00Z',
                note: 'Expert review in progress - High-value item requires detailed analysis'
            }
        ]
    },
    {
        id: 4,
        itemName: 'Gucci Dionysus',
        brand: 'Gucci',
        status: 'Additional Photos Requested',
        submittedAt: '2025-06-30T13:00:00Z',
        statusHistory: [
            {
                status: 'Submitted',
                timestamp: '2025-06-30T13:00:00Z',
                note: 'Authentication request submitted'
            },
            {
                status: 'In Review',
                timestamp: '2025-06-30T14:00:00Z',
                note: 'Expert review in progress'
            },
            {
                status: 'Additional Photos Requested',
                timestamp: '2025-06-30T16:30:00Z',
                note: 'Please provide clearer photos of the serial number and hardware details'
            }
        ]
    },
    {
        id: 5,
        itemName: 'Fake Designer Bag',
        brand: 'Unknown',
        status: 'Rejected',
        submittedAt: '2025-06-28T16:00:00Z',
        completedAt: '2025-06-29T08:00:00Z',
        rejectionReason: 'Authentication failed - counterfeit item detected',
        statusHistory: [
            {
                status: 'Submitted',
                timestamp: '2025-06-28T16:00:00Z',
                note: 'Authentication request submitted'
            },
            {
                status: 'In Review',
                timestamp: '2025-06-28T18:00:00Z',
                note: 'Expert review in progress'
            },
            {
                status: 'Failed Authentication',
                timestamp: '2025-06-29T08:00:00Z',
                note: 'Multiple authenticity markers indicate counterfeit item'
            },
            {
                status: 'Rejected',
                timestamp: '2025-06-29T08:00:00Z',
                note: 'Authentication failed - counterfeit item detected'
            }
        ]
    },
    {
        id: 6,
        itemName: 'Louis Vuitton Neverfull',
        brand: 'Louis Vuitton',
        status: 'Additional Information Requested',
        submittedAt: '2025-06-30T16:00:00Z',
        statusHistory: [
            {
                status: 'Submitted',
                timestamp: '2025-06-30T16:00:00Z',
                note: 'Authentication request submitted'
            },
            {
                status: 'In Review',
                timestamp: '2025-06-30T17:30:00Z',
                note: 'Expert review in progress'
            },
            {
                status: 'Additional Information Requested',
                timestamp: '2025-06-30T19:00:00Z',
                note: 'Please provide purchase receipt or authenticity card for verification'
            }
        ]
    }
]);

// Routes
// app.use('/api', profileRoutes); // Removed - using direct avatar upload route below
app.use('/api/admin', adminServiceRoutes);

// Supabase setup for avatar uploads
const avatarUpload = multer({ dest: 'uploads/' });

const supabase = createClient(
  'https://gyxakkxotjkdsjvbufiv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGFra3hvdGprZHNqdmJ1Zml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjc1MTMsImV4cCI6MjA2NzcwMzUxM30.RT0VJKgdYSUJXzA34diTOpCvenMT6qjMfHaLmCAvEpk'
);

app.post('/api/upload-avatar', avatarUpload.single('avatar'), async (req, res) => {
  console.log('\n🔵 === AVATAR UPLOAD DEBUG START ===');
  
  try {
    // Step 1: Check received data
    console.log('📨 Step 1: Checking received data...');
    const { userId } = req.body;
    const file = req.file;
    
    console.log('   userId:', userId);
    console.log('   file received:', !!file);
    if (file) {
      console.log('   file details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });
    }

    if (!file || !userId) {
      console.log('❌ Missing file or userId');
      return res.status(400).json({ error: 'Missing file or userId' });
    }

    // Step 2: Prepare file path
    console.log('📁 Step 2: Preparing file path...');
    const fileExt = file.originalname.split('.').pop();
    const filePath = `avatars/${userId}.${fileExt}`;
    console.log('   filePath:', filePath);

    // Step 3: Upload to Supabase Storage
    console.log('☁️ Step 3: Uploading to Supabase Storage...');
    const fileBuffer = fs.readFileSync(file.path);
    const uploadResult = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    console.log('   uploadResult:', {
      data: uploadResult.data,
      error: uploadResult.error
    });

    if (uploadResult.error) {
      console.log('❌ Supabase upload failed:', uploadResult.error);
      throw uploadResult.error;
    }

    // Step 4: Get public URL
    console.log('🔗 Step 4: Getting public URL...');
    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    console.log('   publicData:', publicData);
    console.log('   publicUrl:', publicData.publicUrl);

    // Step 5: Update profiles table (with upsert to handle missing rows)
    console.log('💾 Step 5: Updating profiles table...');
    const updateResult = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        avatar_url: publicData.publicUrl 
      })
      .eq('id', userId);
    
    console.log('   updateResult:', {
      data: updateResult.data,
      error: updateResult.error,
      status: updateResult.status,
      statusText: updateResult.statusText
    });

    if (updateResult.error) {
      console.log('❌ Database update failed:', updateResult.error);
      console.log('💡 This might be a Row Level Security (RLS) issue.');
      console.log('💡 You may need to disable RLS or create policies for the profiles table.');
      throw updateResult.error;
    }

    // Step 6: Clean up temporary file
    console.log('🧹 Step 6: Cleaning up temporary file...');
    fs.unlinkSync(file.path);
    console.log('   ✅ Temporary file deleted');

    // Step 7: Send response
    console.log('📤 Step 7: Sending response...');
    console.log('✅ === AVATAR UPLOAD SUCCESS ===\n');
    res.json({ url: publicData.publicUrl });

  } catch (err) {
    console.log('\n❌ === AVATAR UPLOAD ERROR ===');
    console.error('Full error object:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.log('=================================\n');
    
    res.status(500).json({ 
      error: 'Upload failed', 
      details: err.message 
    });
  }
});

/**
 * Get user profile from Supabase profiles table
 * Returns display_name, email, avatar_url for the given user ID
 */
app.get('/api/profile/:userId', async (req, res) => {
  console.log('\n🔵 === PROFILE FETCH DEBUG START ===');
  
  try {
    const { userId } = req.params;
    
    console.log('📨 Step 1: Fetching profile for userId:', userId);
    
    if (!userId) {
      console.log('❌ Missing userId parameter');
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Fetch profile from Supabase
    console.log('🔍 Step 2: Querying Supabase profiles table...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url')
      .eq('id', userId)
      .single();

    console.log('   Query result:', {
      profile: profile,
      error: error
    });

    if (error) {
      console.log('❌ Supabase query failed:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Profile not found',
          message: 'No profile exists for this user ID'
        });
      }
      throw error;
    }

    if (!profile) {
      console.log('❌ No profile found for userId:', userId);
      return res.status(404).json({ 
        error: 'Profile not found',
        message: 'No profile exists for this user ID'
      });
    }

    console.log('✅ Profile found:', profile);
    console.log('✅ === PROFILE FETCH SUCCESS ===\n');
    
    res.json({
      success: true,
      profile: profile
    });

  } catch (err) {
    console.log('\n❌ === PROFILE FETCH ERROR ===');
    console.error('Full error object:', err);
    console.error('Error message:', err.message);
    console.log('=================================\n');
    
    res.status(500).json({ 
      error: 'Failed to fetch profile', 
      details: err.message 
    });
  }
});

/**
 * Get user's push notification settings
 * Returns push_enabled status for the given user ID
 */
app.get('/api/push-settings/:userId', async (req, res) => {
  console.log('\n🔵 === PUSH SETTINGS FETCH DEBUG START ===');
  
  try {
    const { userId } = req.params;
    
    console.log('📨 Fetching push notification settings for userId:', userId);
    
    if (!userId) {
      console.log('❌ Missing userId parameter');
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Fetch profile from Supabase
    console.log('🔍 Querying Supabase profiles table for push settings...');
    const { data, error } = await supabase
      .from('profiles')
      .select('push_enabled')
      .eq('id', userId)
      .single();

    console.log('   Query result:', {
      data: data,
      error: error
    });

    if (error) {
      console.log('❌ Supabase query failed:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Profile not found',
          message: 'No profile exists for this user ID'
        });
      }
      throw error;
    }

    console.log('✅ Push settings found:', data);
    console.log('✅ === PUSH SETTINGS FETCH SUCCESS ===\n');
    
    res.json({
      success: true,
      push_enabled: data?.push_enabled ?? false
    });

  } catch (err) {
    console.log('\n❌ === PUSH SETTINGS FETCH ERROR ===');
    console.error('Full error object:', err);
    console.error('Error message:', err.message);
    console.log('=================================\n');
    
    res.status(500).json({ 
      error: 'Failed to fetch push notification settings', 
      details: err.message 
    });
  }
});

/**
 * Update user's push notification settings
 * Updates push_enabled status for the given user ID
 */
app.post('/api/update-push', async (req, res) => {
  console.log('\n🔵 === PUSH SETTINGS UPDATE DEBUG START ===');
  
  try {
    const { user_id, push_enabled } = req.body;
    
    console.log('📨 Updating push settings:', {
      user_id: user_id,
      push_enabled: push_enabled
    });
    
    if (!user_id) {
      console.log('❌ Missing user_id parameter');
      return res.status(400).json({ error: 'Missing user_id parameter' });
    }

    if (typeof push_enabled !== 'boolean') {
      console.log('❌ Invalid push_enabled value:', push_enabled);
      return res.status(400).json({ error: 'push_enabled must be a boolean value' });
    }

    // Update profile in Supabase
    console.log('🔄 Updating Supabase profiles table...');
    const { data, error } = await supabase
      .from('profiles')
      .update({ push_enabled: push_enabled })
      .eq('id', user_id);

    console.log('   Update result:', {
      data: data,
      error: error
    });

    if (error) {
      console.log('❌ Supabase update failed:', error);
      throw error;
    }

    console.log('✅ Push settings updated successfully');
    console.log('✅ === PUSH SETTINGS UPDATE SUCCESS ===\n');
    
    res.json({
      success: true,
      message: 'Push notification settings updated successfully'
    });

  } catch (err) {
    console.log('\n❌ === PUSH SETTINGS UPDATE ERROR ===');
    console.error('Full error object:', err);
    console.error('Error message:', err.message);
    console.log('=================================\n');
    
    res.status(500).json({ 
      error: 'Failed to update push notification settings', 
      details: err.message 
    });
  }
});

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Root endpoint - API information
app.get('/api', (req, res) => {
    res.json({
        message: 'Vrai Registration API',
        version: '1.0.0',
        endpoints: {
            register: 'POST /register',
            login: 'POST /login',
            userStats: 'GET /user/stats',
            userRequests: 'GET /user/requests',
            static: 'Static files served from /public'
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * Registration endpoint
 * Logs registration data and responds with success message
 */
app.post('/register', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        
        console.log(`\n📝 [${timestamp}] Registration data received:`);
        console.log('📊 Registration Data:', JSON.stringify(req.body, null, 2));
        
        // Validate that we received data
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log('❌ No registration data provided');
            return res.status(400).json({
                error: 'Bad Request',
                message: 'No registration data provided'
            });
        }

        const { email, password, displayName, fullName, phone } = req.body;

        // Validate required fields
        if (!email || !password || !displayName) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email, password, and display name are required'
            });
        }

        // Check if user already exists
        if (registeredUsers.has(email)) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User already exists with this email'
            });
        }

        // Generate a unique user ID (UUID v4)
        const crypto = require('crypto');
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        const userId = generateUUID();

        // Store user data in memory (existing behavior)
        registeredUsers.set(email, {
            id: userId,
            email,
            password, // In production, this would be hashed
            displayName,
            fullName,
            phone,
            isAdmin: false, // New users are not admin by default
            createdAt: timestamp
        });

        // Create profile record in Supabase
        console.log(`🏗️ Creating profile in Supabase for user: ${displayName} (${email})`);
        
        const profileResult = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                display_name: displayName,
                avatar_url: null // Will be set later when user uploads avatar
            });

        console.log('📊 Supabase profile creation result:', {
            data: profileResult.data,
            error: profileResult.error,
            status: profileResult.status
        });

        if (profileResult.error) {
            console.log('❌ Failed to create profile in Supabase:', profileResult.error);
            // Remove from memory if Supabase creation failed
            registeredUsers.delete(email);
            return res.status(500).json({
                error: 'Database Error',
                message: 'Failed to create user profile. Please try again.'
            });
        }
        
        // Log successful registration processing
        console.log(`✅ Registration processed successfully for: ${displayName} (${email})`);
        console.log(`🆔 Generated user ID: ${userId}`);
        
        // Respond with success message and user ID
        res.json({
            message: 'Registration successful',
            userId: userId, // Include user ID in response for frontend use
            profile: {
                id: userId,
                email: email,
                display_name: displayName,
                avatar_url: null
            }
        });
        
    } catch (error) {
        console.error('💥 Registration error:', error);
        
        // Handle unexpected errors gracefully
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred during registration'
        });
    }
});

/**
 * Login endpoint
 * Validates login credentials and responds accordingly
 */
app.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`🔐 Login attempt: Email=${email}, Password=${password}`);

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email and password are required'
            });
        }

        // Look up user in our storage
        const user = registeredUsers.get(email);
        
        if (!user || user.password !== password) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
        }

        console.log(`✅ Login successful! ${user.isAdmin ? '👑 Admin user' : '👤 Regular user'} - ${user.displayName}`);
        res.json({
            message: 'Login successful',
            email: user.email,
            displayName: user.displayName,
            isAdmin: user.isAdmin,
            redirectTo: user.isAdmin ? 'dashboard-admin.html' : 'index.html'
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred during login'
        });
    }
});

/**
 * User Statistics endpoint
 * Returns authentication request statistics for a user
 */
app.get('/user/stats', (req, res) => {
    try {
        const email = req.headers['user-email']; // Get email from header
        
        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User email header is required'
            });
        }

        console.log(`📊 Stats request for user: ${email}`);

        // Get user's authentication requests
        const userRequests = authenticationRequests.get(email) || [];
        
        // Calculate statistics
        const stats = {
            total: userRequests.length,
            pending: userRequests.filter(req => req.status === 'Pending').length,
            authenticated: userRequests.filter(req => req.status === 'Authenticated').length,
            rejected: userRequests.filter(req => req.status === 'Rejected').length
        };

        console.log(`✅ Stats calculated for ${email}:`, stats);

        res.json({
            email,
            statistics: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Stats error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while fetching statistics'
        });
    }
});

/**
 * User Requests endpoint
 * Returns detailed authentication requests for a user
 */
app.get('/user/requests', (req, res) => {
    try {
        const email = req.headers['user-email']; // Get email from header
        
        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User email header is required'
            });
        }

        console.log(`📋 Requests fetch for user: ${email}`);

        // Get user's authentication requests
        const userRequests = authenticationRequests.get(email) || [];
        
        // Sort by submission time descending (most recent first)
        const sortedRequests = userRequests.sort((a, b) => 
            new Date(b.submittedAt) - new Date(a.submittedAt)
        );

        console.log(`✅ Found ${sortedRequests.length} requests for ${email}`);

        res.json({
            email,
            requests: sortedRequests,
            count: sortedRequests.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Requests fetch error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while fetching requests'
        });
    }
});

/**
 * Upload Documents endpoint
 * Handles file uploads for authentication requests
 */
app.post('/api/requests/:id/upload', upload.array('files', 5), (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const email = req.headers['user-email']; // Get email from header
        
        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'User email header is required'
            });
        }

        if (!requestId || isNaN(requestId)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Valid request ID is required'
            });
        }

        console.log(`📤 Upload request for request ID: ${requestId} from user: ${email}`);

        // Find the user's request
        const userRequests = authenticationRequests.get(email) || [];
        const request = userRequests.find(req => req.id === requestId);

        if (!request) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Authentication request not found'
            });
        }

        // Check if request status allows uploads
        const latestStatus = request.statusHistory && request.statusHistory.length > 0 
            ? request.statusHistory[request.statusHistory.length - 1].status 
            : request.status;

        if (latestStatus !== 'Additional Information Requested' && 
            latestStatus !== 'Additional Photos Requested') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'This request does not currently require additional documents'
            });
        }

        // Handle uploaded files
        const uploadedFiles = req.files || [];
        console.log(`📤 Received ${uploadedFiles.length} files for request ${requestId}`);
        
        uploadedFiles.forEach((file, index) => {
            console.log(`   File ${index + 1}: ${file.originalname} (${file.size} bytes) -> ${file.filename}`);
        });

        if (uploadedFiles.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'No files were uploaded'
            });
        }

        console.log(`✅ Documents uploaded successfully for request ${requestId}`);

        // Add upload confirmation to status history
        const uploadNote = latestStatus === 'Additional Photos Requested' 
            ? 'Additional photos uploaded by user'
            : 'Additional information uploaded by user';

        request.statusHistory.push({
            status: 'Documents Uploaded',
            timestamp: new Date().toISOString(),
            note: uploadNote
        });

        // Update the request status to indicate documents received
        request.status = 'Under Review';
        request.statusHistory.push({
            status: 'Under Review',
            timestamp: new Date().toISOString(),
            note: 'Review resumed after receiving additional documents'
        });

        // Process uploaded files metadata for response
        const fileData = uploadedFiles.map(file => ({
            id: require('crypto').randomUUID(),
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date().toISOString()
        }));

        res.json({
            message: 'Your documents have been uploaded successfully',
            requestId: requestId,
            status: 'Documents Uploaded',
            files: fileData,
            uploadCount: uploadedFiles.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Upload error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred during upload'
        });
    }
});

// Create separate upload configuration for authentication submissions
const authUpload = multer({ 
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB for image files
        files: 10 // Allow up to 10 files
    },
    fileFilter: function (req, file, cb) {
        // More permissive filter for authentication photos
        console.log(`🔍 File check: ${file.fieldname} - ${file.originalname} - ${file.mimetype}`);
        
        // Accept all image types and allow files without proper extensions
        const allowedMimeTypes = /^image\//;
        const allowedExtensions = /\.(jpeg|jpg|png|gif|bmp|webp)$/i;
        
        const mimeTypeValid = allowedMimeTypes.test(file.mimetype);
        const extensionValid = allowedExtensions.test(file.originalname) || file.originalname.endsWith('.jpg');
        
        if (mimeTypeValid || extensionValid) {
            console.log(`✅ File accepted: ${file.fieldname}`);
            return cb(null, true);
        } else {
            console.log(`❌ File rejected: ${file.fieldname} - ${file.mimetype} - ${file.originalname}`);
            cb(new Error(`Invalid file type for ${file.fieldname}. Only images are allowed.`));
        }
    }
});

/**
 * Authentication Submission endpoint
 * Handles new authentication requests with photos
 */
app.post('/api/authentication-submission', authUpload.fields([
    { name: 'step1', maxCount: 1 },
    { name: 'step2', maxCount: 1 },
    { name: 'step3', maxCount: 1 },
    { name: 'step4', maxCount: 1 },
    { name: 'step5', maxCount: 1 },
    { name: 'step6', maxCount: 1 },
    { name: 'step7', maxCount: 1 },
    { name: 'step8', maxCount: 1 },
    { name: 'step9', maxCount: 1 },
    { name: 'step10', maxCount: 1 }
]), (req, res) => {
    try {
        const { modelName, timestamp, status = 'pending', userEmail } = req.body;
        
        console.log('\n🎯 [Authentication Submission] New request received:');
        console.log(`📝 Model: ${modelName}`);
        console.log(`⏰ Timestamp: ${timestamp}`);
        console.log(`📧 User Email: ${userEmail}`);
        console.log(`📊 Status: ${status}`);
        
        // Validate required fields
        if (!modelName || !userEmail) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Model name and user email are required'
            });
        }
        
        // Count uploaded photos
        const files = req.files || {};
        const photoCount = Object.keys(files).length;
        console.log(`📸 Photos uploaded: ${photoCount}`);
        
        // Log each uploaded photo
        Object.keys(files).forEach(stepKey => {
            const file = files[stepKey][0]; // Each step has maxCount: 1
            console.log(`   ${stepKey}: ${file.originalname} (${file.size} bytes) -> ${file.filename}`);
        });
        
        // Validate minimum photo requirement
        if (photoCount < 9) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `At least 9 photos are required. Only ${photoCount} photos uploaded.`
            });
        }
        
        // Generate unique ID for the request
        const requestId = Date.now() + Math.floor(Math.random() * 1000);
        
        // Create new authentication request object
        const newRequest = {
            id: requestId,
            itemName: modelName,
            brand: 'Unknown', // Could be extracted from model name or set by admin later
            status: 'Pending',
            submittedAt: timestamp || new Date().toISOString(),
            statusHistory: [
                {
                    status: 'Submitted',
                    timestamp: timestamp || new Date().toISOString(),
                    note: `Authentication request submitted with ${photoCount} photos`
                }
            ],
            photos: Object.keys(files).reduce((acc, stepKey) => {
                const file = files[stepKey][0];
                acc[stepKey] = {
                    originalName: file.originalname,
                    filename: file.filename,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: new Date().toISOString()
                };
                return acc;
            }, {})
        };
        
        // Store the request for the user
        const userRequests = authenticationRequests.get(userEmail) || [];
        userRequests.push(newRequest);
        authenticationRequests.set(userEmail, userRequests);
        
        // Also store in global submissions array for dashboard review
        const submissionSummary = {
            id: requestId,
            modelName: modelName,
            status: 'Pending',
            submittedAt: timestamp || new Date().toISOString(),
            photoCount: photoCount,
            userEmail: userEmail,
            submittedBy: userEmail.split('@')[0] // Extract username for display
        };
        allSubmissions.push(submissionSummary);
        
        console.log(`✅ Authentication request created with ID: ${requestId}`);
        console.log(`📊 User ${userEmail} now has ${userRequests.length} total requests`);
        console.log(`📋 Total submissions in system: ${allSubmissions.length}`);
        
        // Respond with success
        res.json({
            success: true,
            message: 'Submission received',
            requestId: requestId,
            photoCount: photoCount,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('💥 Authentication submission error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while processing the submission'
        });
    }
});

/**
 * Get All Submissions endpoint
 * Returns all authentication submissions for dashboard review
 */
app.get('/api/submissions', (req, res) => {
    try {
        console.log(`\n📋 [Get Submissions] Request received`);
        console.log(`📊 Total submissions: ${allSubmissions.length}`);
        
        // Sort submissions by submission time (newest first)
        const sortedSubmissions = allSubmissions
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        
        console.log(`✅ Returning ${sortedSubmissions.length} submissions`);
        
        res.json({
            success: true,
            submissions: sortedSubmissions,
            count: sortedSubmissions.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('💥 Get submissions error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while fetching submissions'
        });
    }
});

// Consolidated file upload endpoint - removing duplicate functionality
// All file uploads now use /api/requests/:id/upload with consistent numeric ID handling

// Configure Supabase client with service role for admin operations
const supabaseUrl = 'https://gyxakkxotjkdsjvbufiv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

let supabaseAdmin;
if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase Admin client initialized with service role key');
} else {
    console.warn('Supabase Admin client not initialized: Missing URL or service role key');
}

// Endpoint to handle PDF uploads with service role
app.post('/api/admin/upload-pdf', upload.single('pdfFile'), async (req, res) => {
    try {
        console.log('PDF upload request received');
        
        // Check if Supabase Admin client is initialized
        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return res.status(500).json({ error: 'Server configuration error: Supabase Admin client not initialized' });
        }

        // Check if user is authenticated and is an admin
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
        const pdfFile = req.file;
        const submissionId = req.body.submissionId;
        
        if (!pdfFile || !submissionId) {
            console.error('Missing file or submission ID');
            return res.status(400).json({ error: 'Bad Request: Missing file or submission ID' });
        }
        
        console.log('PDF file received:', pdfFile.originalname, 'for submission:', submissionId);
        
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
        
        // Return the public URL
        res.status(200).json({ 
            success: true, 
            message: 'PDF uploaded successfully', 
            url: urlData.publicUrl 
        });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: `Server error: ${error.message}` });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `API endpoint ${req.path} not found`,
        availableEndpoints: [
            'GET /api',
            'POST /register',
            'POST /login',
            'GET /user/stats',
            'GET /user/requests',
            'POST /api/requests/:id/upload',
            'POST /api/authentication-submission',
            'GET /api/submissions',
            'GET /health'
        ]
    });
});

// Global error handling middleware
app.use((error, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`\n💥 [${timestamp}] Unhandled Error:`, error.message);
    console.error('Error Stack:', error.stack);
    
    // Don't expose internal error details in production
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log('\n🚀 Vrai Registration Server Started Successfully!');
    console.log('================================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('\n📂 Static Files:');
    console.log(`   📄 Serving from: ${path.join(__dirname, 'public')}`);
    console.log(`   🔗 Access files at: http://localhost:${PORT}/[filename]`);
    console.log(`   📝 Example: http://localhost:${PORT}/signup.html`);
    console.log('\n📋 Available routes:');
    console.log('   Authentication:');
    console.log('   POST /register               - User registration');
    console.log('   POST /login                  - User login');
    console.log('');
    console.log('   User Data:');
    console.log('   GET  /user/requests          - User authentication requests');
    console.log('');
    console.log('   File Upload:');
    console.log('   POST /api/requests/:id/upload       - Upload documents (standardized)');
    console.log('   POST /api/authentication-submission - Submit authentication request');
    console.log('');
    console.log('   Dashboard:');
    console.log('   GET  /api/submissions               - Get all authentication submissions');
    console.log('');
    console.log('   System:');
    console.log('   GET  /health                        - Health check');
    console.log('');
    console.log('✅ Ready to accept connections!');
    console.log('================================================\n');
});

// Handle server startup errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use.`);
        console.error('💡 Try using a different port: PORT=3001 node server.js');
    } else {
        console.error('❌ Server startup error:', error.message);
    }
    process.exit(1);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('✅ Server closed successfully.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app; 