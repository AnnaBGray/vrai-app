// API endpoint to create a profile with service role privileges
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const profileData = req.body;
    
    // Validate required fields
    if (!profileData || !profileData.id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Insert profile with service role
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: profileData.id,
        full_name: profileData.full_name,
        display_name: profileData.display_name,
        email: profileData.email,
        phone_number: profileData.phone_number
      })
      .select();

    if (error) {
      console.error('Error creating profile:', error);
      return res.status(500).json({ error: error.message });
    }

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Profile created successfully',
      data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 