/**
 * Admin Debug API for Vrai Authentication System
 * For testing Supabase service role key configuration
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
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
    
    try {
        // Check if service role key is available
        if (!supabaseServiceKey) {
            res.statusCode = 500;
            return res.end(JSON.stringify({
                error: 'Server configuration error',
                message: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables'
            }));
        }
        
        // Create Supabase client with service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Test query to authentication_requests table
        const { data, error, status } = await supabaseAdmin
            .from('authentication_requests')
            .select('count', { count: 'exact', head: true });
        
        // Return results
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            success: !error,
            status: status,
            config: {
                supabaseUrl: supabaseUrl,
                serviceKeyConfigured: !!supabaseServiceKey,
                serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0
            },
            error: error,
            data: data,
            timestamp: new Date().toISOString(),
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
            }
        }));
        
    } catch (error) {
        console.error('Admin debug API error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({
            error: 'Server error',
            message: error.message
        }));
    }
}; 