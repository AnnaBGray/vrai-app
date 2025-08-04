const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Get the authorization token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No valid token provided' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Initialize Supabase with service role for admin operations
        const supabaseUrl = 'https://gyxakkxotjkdsjvbufiv.supabase.co';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseServiceKey) {
            console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Verify the user token and check if user is admin
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
            return res.status(403).json({ error: 'Forbidden: User is not authorized for admin operations' });
        }

        // Fetch ALL authentication requests using service role (bypasses RLS)
        const { data: allRequests, error: fetchError } = await supabaseAdmin
            .from('authentication_requests')
            .select(`
                id,
                model_name,
                status,
                created_at,
                updated_at,
                human_readable_id,
                user_email
            `)
            .order('updated_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching authentication requests:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch authentication requests' });
        }

        // Return the data
        res.status(200).json({
            success: true,
            data: allRequests || [],
            count: allRequests ? allRequests.length : 0
        });

    } catch (error) {
        console.error('Admin auth requests API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 