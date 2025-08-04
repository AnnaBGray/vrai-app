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
                message: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables',
                env_keys: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('NEXT_PUBLIC'))
            }));
        }
        
        // Log request info for debugging
        console.log('Admin debug request received:', {
            url: req.url,
            method: req.method,
            path: req.path || 'N/A',
            headers: {
                authorization: req.headers.authorization ? 'Present' : 'Missing',
                contentType: req.headers['content-type']
            }
        });
        
        // Create Supabase client with service role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        // Simple test query - just count records
        const countResult = await supabaseAdmin
            .from('authentication_requests')
            .select('count', { count: 'exact', head: true });
            
        // More detailed test - fetch a single record
        const singleRecordResult = await supabaseAdmin
            .from('authentication_requests')
            .select('id, model_name, status')
            .limit(1)
            .maybeSingle();
        
        // Test if we can get the schema
        const schemaResult = await supabaseAdmin.rpc('get_schema_info', {
            table_name: 'authentication_requests'
        }).catch(e => ({ error: e.message }));
        
        // Return results
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            success: !countResult.error,
            status: countResult.status,
            statusText: countResult.statusText,
            config: {
                supabaseUrl: supabaseUrl,
                serviceKeyConfigured: !!supabaseServiceKey,
                serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
                serviceKeyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : 'N/A'
            },
            countResult: {
                error: countResult.error,
                data: countResult.data,
                count: countResult.count
            },
            singleRecordResult: {
                error: singleRecordResult.error,
                data: singleRecordResult.data
            },
            schemaResult: schemaResult,
            timestamp: new Date().toISOString(),
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                VERCEL_ENV: process.env.VERCEL_ENV || 'unknown',
                env_keys: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('NEXT_PUBLIC'))
            }
        }));
        
    } catch (error) {
        console.error('Admin debug API error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({
            error: 'Server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }));
    }
}; 