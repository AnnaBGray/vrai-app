/**
 * Admin Session Management
 * Handles authentication state, role verification, and navigation safety
 */

// Session validation with comprehensive error handling
function validateUserSession() {
    try {
        const userEmail = sessionStorage.getItem('userEmail');
        const isAdmin = sessionStorage.getItem('isAdmin');
        
        if (!userEmail) {
            console.log('⚠️ No session found, redirecting to login...');
            redirectToLogin();
            return false;
        }
        
        console.log(`✅ Session validated: User=${userEmail}, Admin=${isAdmin === 'true'}`);
        return {
            email: userEmail,
            isAdmin: isAdmin === 'true'
        };
    } catch (error) {
        console.error('❌ Session validation error:', error);
        redirectToLogin();
        return false;
    }
}

// Safe redirect function
function redirectToLogin() {
    try {
        // Clear any corrupted session data
        sessionStorage.clear();
        localStorage.removeItem('displayName');
        
        // Redirect to login
        window.location.href = 'index.html';
    } catch (error) {
        console.error('❌ Redirect error:', error);
        // Fallback: reload page
        window.location.reload();
    }
}

// Navigation safety checks
function setupNavigationSafety() {
    try {
        // Check for broken links to deleted files
        const problematicLinks = [
            'authentication-submissions.html',
            'submissions.html'
        ];
        
        const allLinks = document.querySelectorAll('a[href]');
        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (problematicLinks.includes(href)) {
                console.warn(`🔧 Fixed broken link: ${href} → authenticate-guide.html`);
                link.href = 'authenticate-guide.html';
            }
            
            // Add click validation to navigation links
            if (href && !href.startsWith('#') && !href.startsWith('http')) {
                link.addEventListener('click', function(e) {
                    const session = validateUserSession();
                    if (!session) {
                        e.preventDefault();
                        console.log('🚫 Navigation blocked: invalid session');
                        return false;
                    }
                });
            }
        });
        
        // Check for broken buttons with onclick handlers
        const buttons = document.querySelectorAll('button[onclick]');
        buttons.forEach(button => {
            const onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes('authentication-submissions.html')) {
                console.warn('🔧 Fixed broken button onclick');
                button.setAttribute('onclick', onclick.replace('authentication-submissions.html', 'authenticate-guide.html'));
            }
        });
        
    } catch (error) {
        console.error('❌ Navigation safety setup error:', error);
    }
}

// Page initialization with error handling
function initializePageSafety() {
    try {
        console.log('🚀 Initializing page safety checks...');
        
        // Validate session
        const session = validateUserSession();
        if (!session) {
            return; // Will redirect to login
        }
        
        // Setup navigation safety
        setupNavigationSafety();
        
        // Setup dynamic dashboard links
        const dashboardLinks = document.querySelectorAll('[id*="dashboard-link"], a[href*="dashboard"]');
        dashboardLinks.forEach(link => {
            if (link.href.includes('dashboard') && !link.href.includes('admin')) {
                const correctDashboard = session.isAdmin ? 'dashboard-admin.html' : 'dashboard.html';
                link.href = correctDashboard;
            }
        });
        
        console.log('✅ Page safety initialization complete');
        
    } catch (error) {
        console.error('❌ Page initialization error:', error);
        // Fallback: redirect to login
        redirectToLogin();
    }
}

// Check if user is admin
function isAdminUser() {
    const session = validateUserSession();
    return session && session.isAdmin;
}

// Get proper dashboard URL
function getDashboardUrl() {
    return isAdminUser() ? 'dashboard-admin.html' : 'dashboard.html';
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePageSafety);

// Handle page visibility changes (prevent session loss on tab switch)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Re-validate session when page becomes visible
        validateUserSession();
    }
});

// Export functions for manual use
window.validateUserSession = validateUserSession;
window.isAdminUser = isAdminUser;
window.getDashboardUrl = getDashboardUrl;
window.setupNavigationSafety = setupNavigationSafety; 