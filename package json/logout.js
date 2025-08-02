/**
 * Logout functionality for Vrai using Supabase Auth
 */

// Function to handle logout
async function handleLogout() {
    try {
        // Get Supabase client from global variable
        const supabase = window.supabaseClient;
        
        // Check if Supabase client is available
        if (!supabase) {
            throw new Error('Supabase client not available. Make sure the Supabase script is loaded.');
        }
        
        // Show loading state on logout button if it exists
        const logoutBtn = document.querySelector('[data-logout]');
        let originalText = '';
        if (logoutBtn) {
            originalText = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span> Signing out...';
            logoutBtn.disabled = true;
        }
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            // Show error message if needed
            alert('Error signing out. Please try again.');
            
            // Reset logout button
            if (logoutBtn) {
                logoutBtn.innerHTML = originalText;
                logoutBtn.disabled = false;
            }
            return;
        }
        
        // Clear local storage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        localStorage.removeItem('displayName');
        localStorage.removeItem('isAdmin');
        
        // Clear session storage
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('displayName');
        sessionStorage.removeItem('isAdmin');
        
        // Redirect to login page
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('An unexpected error occurred. Please try again.');
    }
}

// Initialize logout buttons
document.addEventListener('DOMContentLoaded', function() {
    // Find all logout buttons
    const logoutButtons = document.querySelectorAll('[data-logout]');
    
    // Add click event listener to each logout button
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    });
}); 