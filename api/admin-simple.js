/**
 * Simplified Admin API for Vrai Authentication System
 * Direct access to authentication_requests without middleware complexity
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyxakkxotjkdsjvbufiv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        return res.end();
    }
    
    try {
        console.log('Simplified admin API request received');
        
        // Check if service role key is available
        if (!supabaseServiceKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
            res.statusCode = 500;
            return res.end(JSON.stringify({ 
                error: 'Server configuration error', 
                message: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables'
            }));
        }
        
        // Create Supabase client with service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        // Simple query - no complex filters or joins
        const { data, error, status } = await supabaseAdmin
            .from('authentication_requests')
            .select('id, model_name, status, created_at, updated_at, human_readable_id, user_email')
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching authentication requests:', error);
            res.statusCode = 500;
            return res.end(JSON.stringify({ 
                error: 'Failed to fetch authentication requests', 
                details: error,
                status: status
            }));
        }
        
        console.log(`Successfully fetched ${data?.length || 0} authentication requests`);
        
        // Return success response
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ 
            success: true, 
            data: data || [] 
        }));
        
    } catch (error) {
        console.error('Server error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ 
            error: 'Server error', 
            message: error.message 
        }));
    }
}; 