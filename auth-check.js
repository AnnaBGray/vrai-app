/**
 * Authentication check for Vrai using Supabase Auth
 * Include this script in pages that require authentication
 */

// Self-executing async function to check authentication
(async function() {
    try {
        // Get Supabase client from global variable
        const supabase = window.supabaseClient;
        
        // Check if Supabase client is available
        if (!supabase) {
            console.error('Supabase client not available. Make sure the Supabase script is loaded.');
            redirectToLogin();
            return;
        }
        
        // Check if user is authenticated
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Auth check error:', error);
            redirectToLogin();
            return;
        }
        
        // If no session, redirect to login
        if (!session) {
            console.log('No active session found');
            redirectToLogin();
            return;
        }
        
        // Check if user has a profile in the database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (profileError || !profile) {
            console.error('Profile check error:', profileError);
            // Try to create a profile if it doesn't exist
            if (profileError && profileError.code === 'PGRST116') { // Record not found
                await createProfile(session.user, supabase);
            } else {
                redirectToLogin();
                return;
            }
        }
        
        // Update local storage with user info if needed
        updateLocalStorage(session.user, profile);
        
        // Check if the current page requires admin access
        const requiresAdmin = document.body.hasAttribute('data-admin-only');
        
        if (requiresAdmin) {
            const isAdmin = profile?.is_admin || localStorage.getItem('isAdmin') === 'true';
            
            if (!isAdmin) {
                console.log('Admin access required but user is not an admin');
                window.location.href = 'index.html'; // Redirect to regular dashboard
                return;
            }
        }
        
        // User is authenticated and authorized
        console.log('Authentication check passed');
        
        // Show user info in the UI if needed
        updateUI(session.user, profile);
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        redirectToLogin();
    }
})();

/**
 * Redirect to login page
 */
function redirectToLogin() {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', window.location.href);
    
    // Redirect to login page
    window.location.href = 'index.html';
}

/**
 * Create a profile for a user
 */
async function createProfile(user, supabase) {
    try {
        // If supabase client wasn't passed, try to get it from global variable
        if (!supabase) {
            supabase = window.supabaseClient;
            
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
        }
        
        // Create a basic profile
        const { error } = await supabase.from('profiles').insert([
            {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'User',
                display_name: user.user_metadata?.display_name || 'User',
                phone: user.user_metadata?.phone || '',
                avatar_url: user.user_metadata?.avatar_url || '',
                is_admin: false,
                created_at: new Date().toISOString()
            }
        ]);
        
        if (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
        
        console.log('Profile created successfully');
        
    } catch (error) {
        console.error('Failed to create profile:', error);
        throw error;
    }
}

/**
 * Update local storage with user info
 */
function updateLocalStorage(user, profile) {
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userId', user.id);
    
    if (profile) {
        localStorage.setItem('displayName', profile.display_name || 'User');
        localStorage.setItem('isAdmin', profile.is_admin ? 'true' : 'false');
    }
}

/**
 * Update UI with user info
 */
function updateUI(user, profile) {
    // Update display name in UI
    const displayNameElements = document.querySelectorAll('[data-display-name]');
    if (displayNameElements.length > 0) {
        const displayName = profile?.display_name || user.user_metadata?.display_name || user.email;
        displayNameElements.forEach(element => {
            element.textContent = displayName;
        });
    }
    
    // Update user email in UI
    const userEmailElements = document.querySelectorAll('[data-user-email]');
    if (userEmailElements.length > 0) {
        userEmailElements.forEach(element => {
            element.textContent = user.email;
        });
    }
    
    // Update avatar in UI
    const avatarElements = document.querySelectorAll('[data-user-avatar]');
    if (avatarElements.length > 0) {
        const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
        if (avatarUrl) {
            avatarElements.forEach(element => {
                if (element.tagName === 'IMG') {
                    element.src = avatarUrl;
                } else {
                    element.style.backgroundImage = `url(${avatarUrl})`;
                }
            });
        }
    }
    
    // Show admin-only elements if user is admin
    const isAdmin = profile?.is_admin || localStorage.getItem('isAdmin') === 'true';
    const adminElements = document.querySelectorAll('[data-admin-only]');
    
    if (adminElements.length > 0) {
        adminElements.forEach(element => {
            if (isAdmin) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
    }
} 