/**
 * Initialize Supabase client globally
 * This script should be included before any other scripts that use Supabase
 */

// Check if Supabase is available from CDN
if (typeof window !== 'undefined') {
    console.log('🔍 Checking for Supabase availability...');
    
    if (typeof window.supabase !== 'undefined') {
        try {
            console.log('✓ Supabase library found, initializing client...');
            
            // Create and expose the Supabase client globally
            window.supabaseClient = window.supabase.createClient(
                'https://gyxakkxotjkdsjvbufiv.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGFra3hvdGprZHNqdmJ1Zml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjc1MTMsImV4cCI6MjA2NzcwMzUxM30.RT0VJKgdYSUJXzA34diTOpCvenMT6qjMfHaLmCAvEpk'
            );
            
            // Test the client with a simple query
            window.supabaseClient.from('profiles').select('count', { count: 'exact', head: true })
                .then(response => {
                    if (response.error) {
                        console.error('❌ Supabase client test query failed:', response.error);
                    } else {
                        console.log('✅ Supabase client test query successful');
                    }
                })
                .catch(err => {
                    console.error('❌ Supabase client test query error:', err);
                });
            
            console.log('✅ Supabase client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase client:', error);
        }
    } else {
        console.error('❌ Supabase library not found. Make sure to include the Supabase script from CDN.');
    }
} 