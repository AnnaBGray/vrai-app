// Simplified upload API that doesn't use formidable
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyxakkxotjkdsjvbufiv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Simple PDF upload API called');
    
    // Check if Supabase Admin client is initialized properly
    if (!supabaseServiceKey || supabaseServiceKey === '') {
      console.error('Supabase Admin client not initialized - missing service key');
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase service key' });
    }
    
    // For this simplified version, we'll just return a dummy URL
    const dummyUrl = 'https://gyxakkxotjkdsjvbufiv.supabase.co/storage/v1/object/public/reports/dummy-report.pdf';
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'PDF upload simulated successfully', 
      url: dummyUrl 
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
} 