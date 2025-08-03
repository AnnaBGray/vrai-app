/**
 * Supabase Auth Check
 * This script handles authentication checks for protected pages
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔐 Running Supabase Auth Check...');
    
    // Skip auth check if on login page
    if (window.location.pathname.includes('index.html')) {
        console.log('🔄 On login page, skipping auth check');
        return;
    }
    
    // Get Supabase client from global variable
    const supabase = window.supabaseClient;
    
    if (!supabase) {
        console.error('❌ Supabase client not available. Make sure supabase-init.js is loaded first.');
        // Fall back to localStorage/sessionStorage check
        checkLocalStorageAuth();
        return;
    }
    
    try {
        // Check if user is logged in with Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Supabase session check error:', error);
            // Fall back to localStorage/sessionStorage check
            checkLocalStorageAuth();
            return;
        }
        
        if (!session) {
            console.log('⚠️ No active Supabase session found');
            // Fall back to localStorage/sessionStorage check
            checkLocalStorageAuth();
            return;
        }
        
        console.log('✅ Active Supabase session found:', session.user.id);
        
        // Store user info in sessionStorage for other scripts
        sessionStorage.setItem('userEmail', session.user.email);
        sessionStorage.setItem('userId', session.user.id);
        
        // Get user profile from profiles table
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin, display_name')
                .eq('id', session.user.id)
                .single();
            
            if (profileError) {
                console.error('❌ Error fetching user profile:', profileError);
                // Don't redirect, just use what we have
                if (!sessionStorage.getItem('displayName') && localStorage.getItem('displayName')) {
                    sessionStorage.setItem('displayName', localStorage.getItem('displayName'));
                }
                if (!sessionStorage.getItem('isAdmin') && localStorage.getItem('isAdmin')) {
                    sessionStorage.setItem('isAdmin', localStorage.getItem('isAdmin'));
                }
            } else if (profileData) {
                // Store profile info in sessionStorage
                sessionStorage.setItem('displayName', profileData.display_name || 'User');
                sessionStorage.setItem('isAdmin', profileData.is_admin ? 'true' : 'false');
                
                // Also store in localStorage for persistence
                localStorage.setItem('userEmail', session.user.email);
                localStorage.setItem('userId', session.user.id);
                localStorage.setItem('displayName', profileData.display_name || 'User');
                localStorage.setItem('isAdmin', profileData.is_admin ? 'true' : 'false');
            }
        } catch (profileError) {
            console.error('❌ Error in profile fetch:', profileError);
            // Don't redirect, use existing data if available
        }
        
    } catch (error) {
        console.error('❌ Supabase auth check error:', error);
        // Fall back to localStorage/sessionStorage check
        checkLocalStorageAuth();
    }
});

/**
 * Check localStorage and sessionStorage for auth data
 * as fallback when Supabase auth fails
 */
function checkLocalStorageAuth() {
    console.log('🔄 Checking localStorage/sessionStorage for auth data...');
    
    const userEmail = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    
    if (!userEmail || !userId) {
        console.log('❌ No auth data found in storage, redirecting to login...');
        
        // Don't redirect if already on login page
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return false;
    }
    
    console.log('✅ Auth data found in storage:', { userEmail, userId });
    
    // Ensure data is in sessionStorage (for current session)
    sessionStorage.setItem('userEmail', userEmail);
    sessionStorage.setItem('userId', userId);
    
    // Copy any other auth data from localStorage if not in sessionStorage
    ['displayName', 'isAdmin'].forEach(key => {
        if (!sessionStorage.getItem(key) && localStorage.getItem(key)) {
            sessionStorage.setItem(key, localStorage.getItem(key));
        }
    });
    
    return true;
} 