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
            
            // Get Supabase URL and anon key from environment variables or data attributes
            const supabaseUrl = 
                window.NEXT_PUBLIC_SUPABASE_URL || 
                document.querySelector('meta[name="supabase-url"]')?.getAttribute('content') || 
                'https://gyxakkxotjkdsjvbufiv.supabase.co';
            
            const supabaseAnonKey = 
                window.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                document.querySelector('meta[name="supabase-anon-key"]')?.getAttribute('content') || 
                'sb_publishable_Ba2TDqOIk3p5jSMkEgzPWg_RmkoWrTx';

            console.log('📝 Supabase Configuration:', {
                url: supabaseUrl,
                keyConfigured: !!supabaseAnonKey,
                keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
                metaTag: !!document.querySelector('meta[name="supabase-url"]'),
                metaKeyTag: !!document.querySelector('meta[name="supabase-anon-key"]')
            });
            
            // Create and expose the Supabase client globally
            window.supabaseClient = window.supabase.createClient(
                supabaseUrl,
                supabaseAnonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                }
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