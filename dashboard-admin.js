/**
 * Dashboard Admin - Authentication Requests Handler
 * Fetches and displays user's latest authentication requests
 */

// Initialize Supabase client
let supabaseClient;

// Page detection - determine which page we're on
function getCurrentPage() {
    // Check for admin.html specific elements
    if (document.querySelector('[data-stat="total-submissions"]')) {
        return 'admin';
    }
    // Check for dashboard-admin.html specific elements
    if (document.getElementById('total-requests')) {
        return 'dashboard-admin';
    }
    return 'unknown';
}

// Initialize the client when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for supabase-init.js to load
    const waitForSupabase = () => {
        if (window.supabaseClient) {
            supabaseClient = window.supabaseClient;
            console.log('[DASHBOARD] Supabase client initialized');
            
            // Only load data if we're on a supported page
            const currentPage = getCurrentPage();
            if (currentPage !== 'unknown') {
                console.log(`[DASHBOARD] Loading data for page: ${currentPage}`);
                loadAuthenticationRequests();
            } else {
                console.log('[DASHBOARD] Page not recognized, skipping data load');
            }
        } else {
            console.log('[DASHBOARD] Waiting for Supabase client...');
            setTimeout(waitForSupabase, 500);
        }
    };
    
    waitForSupabase();
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DASHBOARD] DOM content loaded, initializing dashboard...');
    
    // Force a fresh fetch from Supabase by clearing any cached data
    if (supabaseClient) {
        // Clear any cached data
        supabaseClient.auth.refreshSession();
    }
    
    // Initialize the dashboard with a slight delay to ensure Supabase is ready
    setTimeout(() => {
        loadAuthenticationRequests();
    }, 100);
});

/**
 * Fetch authentication requests for the current user
 * @returns {Promise<Array>} - Array of authentication requests
 */
async function fetchAuthenticationRequests() {
    try {
        console.log('[DASHBOARD] Fetching authentication requests...');
        
        // Ensure Supabase client is available
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        console.log('[DASHBOARD] Current user:', user.id);

        const currentPage = getCurrentPage();
        
        if (currentPage === 'admin') {
            // For admin page, fetch ALL authentication requests for accurate statistics
            // No limit on the query to ensure we get all records
            const { data: allRequests, error: adminError } = await supabaseClient
                .from('authentication_requests')
                .select('id, model_name, status, created_at, updated_at, human_readable_id, user_email')
                .order('updated_at', { ascending: false });
                
            if (adminError) {
                console.error('[DASHBOARD] Error fetching admin authentication requests:', adminError);
                throw adminError;
            }
            
            console.log('[DASHBOARD] Fetched admin authentication requests:', allRequests?.length || 0);
            
            // For display in the Recent Activity section, limit to 5 most recent
            const recentRequests = allRequests ? allRequests.slice(0, 5) : [];
            
            // Return all requests for statistics, but only show 5 most recent in the UI
            return {
                all: allRequests || [],
                recent: recentRequests
            };
            
        } else {
            // For user dashboard, fetch only their requests
            const { data: requests, error } = await supabaseClient
                .from('authentication_requests')
                .select(`
                    *,
                    auth_submissions!inner(
                        user_id
                    )
                `)
                .eq('auth_submissions.user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(10); // Limit to 10 most recent

            if (error) {
                console.error('[DASHBOARD] Error fetching authentication requests:', error);
                throw error;
            }

            console.log('[DASHBOARD] Fetched user authentication requests:', requests?.length || 0);
            return {
                all: requests || [],
                recent: requests || []
            };
        }

    } catch (error) {
        console.error('[DASHBOARD] Error in fetchAuthenticationRequests:', error);
        throw error;
    }
}

/**
 * Load and display authentication requests in the Recent Activity section
 */
async function loadAuthenticationRequests() {
    try {
        const requests = await fetchAuthenticationRequests();
        
        // Update the Recent Activity section
        updateRecentActivity(requests.recent);
        
        // Update statistics cards
        updateStatisticsCards(requests.all);
        
    } catch (error) {
        console.error('[DASHBOARD] Error loading authentication requests:', error);
        showActivityError();
    }
}

/**
 * Update the Recent Activity section with authentication requests
 * @param {Array} requests - Array of authentication request objects
 */
function updateRecentActivity(requests) {
    const currentPage = getCurrentPage();
    let activityContainer = null;
    
    if (currentPage === 'admin') {
        // admin.html uses data-container attribute
        activityContainer = document.querySelector('[data-container="recent-activity"]');
    } else if (currentPage === 'dashboard-admin') {
        // dashboard-admin.html uses class selector
        activityContainer = document.querySelector('.divide-y.divide-gray-100');
    }
    
    if (!activityContainer) {
        console.error('[DASHBOARD] Activity container not found for page:', currentPage);
        return;
    }

    // Clear existing activities
    activityContainer.innerHTML = '';

    if (requests.length === 0) {
        // Show message when no requests
        activityContainer.innerHTML = `
            <div class="p-6 text-center text-gray-500">
                <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-sm">No authentication requests yet</p>
                <p class="text-xs mt-1">Your requests will appear here</p>
            </div>
        `;
        return;
    }

    // Sort requests by timestamp (newest first) if not already sorted
    const sortedRequests = [...requests].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB - dateA; // Descending order (newest first)
    });

    // Limit to 3 most recent entries for admin.html page
    const limitedRequests = currentPage === 'admin' ? sortedRequests.slice(0, 3) : sortedRequests;

    // Add each request as an activity item
    limitedRequests.forEach((request, index) => {
        const activityItem = createActivityItem(request);
        activityContainer.appendChild(activityItem);
    });

    console.log('[DASHBOARD] Updated Recent Activity with', limitedRequests.length, 'requests', 
        currentPage === 'admin' ? '(limited to 3)' : '');
}

/**
 * Create an activity item HTML element for an authentication request
 * @param {Object} request - Authentication request object
 * @returns {HTMLElement} - Activity item element
 */
function createActivityItem(request) {
    const div = document.createElement('div');
    const currentPage = getCurrentPage();
    
    // Use different styling based on the page
    if (currentPage === 'admin') {
        div.className = 'bg-white rounded-md p-3 shadow-sm mb-2';
        
        const statusColor = getStatusColor(request.status);
        const timeAgo = getTimeAgo(request.updated_at || request.created_at);
        const statusText = getStatusText(request.status, request.model_name);
        const humanReadableId = request.human_readable_id || `Vrai#${request.id.substring(0, 6)}`;
        const userEmail = request.user_email || 'Unknown';
        
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-2 h-2 ${statusColor} rounded-full flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-900">${statusText}</p>
                        <p class="text-xs text-gray-500">${timeAgo}</p>
                    </div>
                    <p class="text-xs text-gray-500">
                        ${humanReadableId}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                        Submitted by ${userEmail}
                    </p>
                </div>
            </div>
        `;
    } else if (currentPage === 'dashboard-admin') {
        div.className = 'p-6';
        
        const timeAgo = getTimeAgo(request.updated_at || request.created_at);
        const statusText = getStatusText(request.status, request.model_name);
        const iconHTML = getStatusIcon(request.status);
        const iconBackground = getStatusIconBackground(request.status);
        
        div.innerHTML = `
            <div class="flex items-start">
                <div class="w-10 h-10 ${iconBackground} rounded-full flex items-center justify-center flex-shrink-0">
                    ${iconHTML}
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-900">${statusText}</p>
                    <p class="text-xs text-gray-400 mt-1">${timeAgo}</p>
                </div>
            </div>
        `;
    }
    
    return div;
}

/**
 * Get status color class based on status
 * @param {string} status - Request status
 * @returns {string} - CSS class for status color
 */
function getStatusColor(status) {
    switch (status) {
        case 'Authenticated':
            return 'bg-green-500';
        case 'Pending Review':
            return 'bg-yellow-500';
        case 'Rejected':
            return 'bg-red-500';
        case 'Action Required':
            return 'bg-blue-500';
        default:
            return 'bg-gray-500';
    }
}

/**
 * Get relative time string from timestamp
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Relative time string
 */
function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now - time;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
        return 'Just now';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else {
        return `${diffInDays} days ago`;
    }
}

/**
 * Get status text for display
 * @param {string} status - Request status
 * @param {string} modelName - Model name
 * @returns {string} - Display text
 */
function getStatusText(status, modelName) {
    const model = modelName || 'Unknown Model';
    
    // Handle null/undefined status
    if (!status) {
        return `Submitted ${model}`;
    }
    
    switch (status) {
        case 'Pending Review':
            return `Submitted ${model}`;
        case 'Authenticated':
            return `Authenticated ${model}`;
        case 'Rejected':
            return `Rejected ${model}`;
        case 'Action Required':
            return `Action required for ${model}`;
        default:
            // For any unknown status, show a generic message
            return `Updated ${model}`;
    }
}

/**
 * Get status icon HTML
 * @param {string} status - Request status
 * @returns {string} - Icon HTML
 */
function getStatusIcon(status) {
    // Handle null/undefined status - treat as pending
    if (!status) {
        return `<svg class="w-5 h-5 text-primary-500" viewBox="0 0 24 24" fill="none">
            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
        </svg>`;
    }
    
    switch (status) {
        case 'Pending Review':
            return `<svg class="w-5 h-5 text-primary-500" viewBox="0 0 24 24" fill="none">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
            </svg>`;
        case 'Authenticated':
            return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="9" width="14" height="8" rx="2" fill="#F8E7B9" stroke="#D4AF37" stroke-width="1.2"/>
                <path d="M8 9V7.5A4 4 0 0 1 16 7.5V9" stroke="#D4AF37" stroke-width="1.2" stroke-linecap="round" fill="none"/>
                <path d="M9.2 13.2L11 15L14.2 11.8" stroke="#D4AF37" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>`;
        case 'Rejected':
            return `<svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>`;
        case 'Action Required':
            return `<svg class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>`;
        default:
            // For any unknown status, show a generic icon
            return `<svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>`;
    }
}

/**
 * Get status icon background color
 * @param {string} status - Request status
 * @returns {string} - CSS classes
 */
function getStatusIconBackground(status) {
    // Handle null/undefined status - treat as pending
    if (!status) {
        return 'bg-primary-500/10';
    }
    
    switch (status) {
        case 'Pending Review':
            return 'bg-primary-500/10';
        case 'Authenticated':
            return 'bg-[#FFF4DC]';
        case 'Rejected':
            return 'bg-red-100';
        case 'Action Required':
            return 'bg-orange-100';
        default:
            return 'bg-gray-100';
    }
}

/**
 * Update statistics cards with request data
 * @param {Array} requests - Array of authentication requests
 */
function updateStatisticsCards(requests) {
    const stats = calculateStatistics(requests);
    const currentPage = getCurrentPage();
    
    if (currentPage === 'admin') {
        // admin.html uses data-stat attributes
        const totalElement = document.querySelector('[data-stat="total-submissions"]');
        const pendingElement = document.querySelector('[data-stat="pending-review"]');
        const approvedElement = document.querySelector('[data-stat="approved-today"]');
        const activeUsersElement = document.querySelector('[data-stat="active-users"]');
        
        if (totalElement) totalElement.textContent = stats.total;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (approvedElement) approvedElement.textContent = stats.processedTodayCount;
        if (activeUsersElement) activeUsersElement.textContent = stats.activeUsers;
        
    } else if (currentPage === 'dashboard-admin') {
        // dashboard-admin.html uses id attributes
        const totalElement = document.getElementById('total-requests');
        const pendingElement = document.getElementById('pending-requests');
        const approvedElement = document.getElementById('authenticated-requests');
        const rejectedElement = document.getElementById('rejected-requests');
        
        if (totalElement) totalElement.textContent = stats.total;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (approvedElement) approvedElement.textContent = stats.processedTodayCount;
        if (rejectedElement) rejectedElement.textContent = stats.rejected;
    }

    console.log('[DASHBOARD] Updated statistics cards:', stats);
}

/**
 * Calculate statistics from requests array
 * @param {Array} requests - Array of authentication requests
 * @returns {Object} - Statistics object
 */
function calculateStatistics(requests) {
    // Calculate total submissions
    const total = requests.length;
    
    // Calculate pending review count
    const pending = requests.filter(r => !r.status || r.status === 'Pending Review').length;
    
    // Calculate rejected count
    const rejected = requests.filter(r => r.status === 'Rejected').length;
    
    // Calculate processed today count (includes Authenticated, Rejected, and Action Required)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    
    const processedTodayCount = requests.filter(r => {
        // Check if the status is one of the processed statuses
        if (!['Authenticated', 'Rejected', 'Action Required'].includes(r.status)) return false;
        
        // Check if it was processed today
        const updatedAt = new Date(r.updated_at);
        return updatedAt >= today;
    }).length;
    
    // Count unique active users based on user_email field
    const uniqueUsers = new Set();
    requests.forEach(request => {
        if (request.user_email) {
            uniqueUsers.add(request.user_email);
        }
    });
    const activeUsers = uniqueUsers.size;

    console.log('[DASHBOARD] Calculated statistics:', { 
        total, 
        pending, 
        processedTodayCount, 
        rejected, 
        activeUsers,
        uniqueEmails: Array.from(uniqueUsers)
    });

    return { total, pending, processedTodayCount, rejected, activeUsers };
}

/**
 * Show error message in activity section
 */
function showActivityError() {
    const currentPage = getCurrentPage();
    let activityContainer = null;
    
    if (currentPage === 'admin') {
        activityContainer = document.querySelector('[data-container="recent-activity"]');
    } else if (currentPage === 'dashboard-admin') {
        activityContainer = document.querySelector('.divide-y.divide-gray-100');
    }
    
    if (!activityContainer) return;
    
    activityContainer.innerHTML = `
        <div class="p-6 text-center text-red-500">
            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm">Error loading authentication requests</p>
        </div>
    `;
}

// Export functions for use in other scripts
window.loadAuthenticationRequests = loadAuthenticationRequests;
window.fetchAuthenticationRequests = fetchAuthenticationRequests; 