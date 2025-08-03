/**
 * Authentication Submissions - Supabase Integration
 * Fetches and displays user's authentication requests from Supabase
 */

// Initialize Supabase client
let supabaseClient;

// Initialize the client when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for supabase-init.js to load
    const waitForSupabase = () => {
        if (window.supabaseClient) {
            supabaseClient = window.supabaseClient;
            console.log('[AUTH-SUBMISSIONS] Supabase client initialized');
            loadSubmissions();
        } else {
            console.log('[AUTH-SUBMISSIONS] Waiting for Supabase client...');
            setTimeout(waitForSupabase, 500);
        }
    };
    
    waitForSupabase();
});

/**
 * Fetch authentication requests for the current user
 * @returns {Promise<Array>} - Array of authentication requests
 */
async function fetchAuthenticationRequests() {
    try {
        console.log('[AUTH-SUBMISSIONS] Fetching authentication requests...');
        
        // Ensure Supabase client is available
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Get current user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        console.log('[AUTH-SUBMISSIONS] Current user:', user.id);

        // Query authentication_requests with joined auth_submissions
        const { data: requests, error } = await supabaseClient
            .from('authentication_requests')
            .select(`
                id,
                model_name,
                status,
                created_at,
                updated_at,
                human_readable_id,
                submission_id,
                admin_notes,
                report_url,
                auth_submissions!inner(
                    user_id
                )
            `)
            .eq('auth_submissions.user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[AUTH-SUBMISSIONS] Error fetching authentication requests:', error);
            throw error;
        }

        console.log('[AUTH-SUBMISSIONS] Fetched authentication requests:', requests);
        return requests || [];

    } catch (error) {
        console.error('[AUTH-SUBMISSIONS] Error in fetchAuthenticationRequests:', error);
        throw error;
    }
}

/**
 * Load user submissions from Supabase
 */
async function loadSubmissions() {
    try {
        console.log('[AUTH-SUBMISSIONS] Loading submissions from Supabase...');
        
        const requests = await fetchAuthenticationRequests();
        
        // Transform Supabase data to match expected format
        const submissions = requests.map(request => ({
            id: request.id,
            humanReadableId: request.human_readable_id,
            modelName: request.model_name,
            status: request.status,
            submittedAt: request.created_at,
            completedAt: request.updated_at, // Use updated_at as completed_at if available
            adminNotes: request.admin_notes,
            reportUrl: request.report_url // Include report_url for authenticated submissions
        }));
        
        console.log('[AUTH-SUBMISSIONS] Transformed submissions:', submissions);
        
        // Display submissions using existing logic
        displaySubmissions(submissions);
        
    } catch (error) {
        console.error('[AUTH-SUBMISSIONS] Error loading submissions:', error);
        showErrorState();
    }
}

/**
 * Get submissions filtered by category
 * @param {Array} submissions - Array of submission objects
 * @param {string} filter - Filter type ('all', 'in-progress', 'completed')
 * @returns {Array} - Filtered submissions
 */
function getFilteredSubmissions(submissions, filter) {
    if (filter === 'all') {
        return submissions;
    }

    return submissions.filter(submission => {
        const status = submission.status;
        
        if (filter === 'in-progress') {
            // In Progress: Pending Review and Action Required (including null status)
            return !status || // Treat null/undefined as in-progress
                   status === 'Pending Review' || 
                   status === 'Action Required';
        }
        
        if (filter === 'completed') {
            // Completed: Authenticated and Rejected
            return status === 'Authenticated' || 
                   status === 'Rejected';
        }
        
        return false;
    });
}

/**
 * Get status badge styling and text
 * @param {string} status - Request status
 * @returns {Object} - Badge styling object
 */
function getStatusBadge(status) {
    // Handle null/undefined status - treat as pending review
    if (!status) {
        return {
            bgClass: 'bg-blue-100',
            textClass: 'text-blue-700',
            text: 'Pending Review'
        };
    }
    
    switch (status) {
        case 'Authenticated':
            return {
                bgClass: 'bg-green-100',
                textClass: 'text-green-700',
                text: 'Authenticated'
            };
        case 'Pending Review':
            return {
                bgClass: 'bg-blue-100',
                textClass: 'text-blue-700',
                text: 'Pending Review'
            };
        case 'Rejected':
            return {
                bgClass: 'bg-red-100',
                textClass: 'text-red-700',
                text: 'Rejected'
            };
        case 'Action Required':
            return {
                bgClass: 'bg-orange-100',
                textClass: 'text-orange-700',
                text: 'Action Required'
            };
        default:
            return {
                bgClass: 'bg-gray-100',
                textClass: 'text-gray-700',
                text: status || 'Pending Review'
            };
    }
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
    });
}

// Export functions for use in the main HTML file
window.loadSubmissions = loadSubmissions;
window.fetchAuthenticationRequests = fetchAuthenticationRequests;
window.getFilteredSubmissions = getFilteredSubmissions;
window.getStatusBadge = getStatusBadge;
window.formatDate = formatDate; 