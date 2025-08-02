/**
 * Supabase Submission Handler
 * Manages authentication submissions and requests
 */

// Initialize Supabase client
let supabaseClient;

/**
 * Wait for Supabase client to be available
 * @returns {Promise<Object>} - The Supabase client
 */
async function waitForSupabaseClient() {
    // If client is already available, return it
    if (supabaseClient) {
        return supabaseClient;
    }
    
    // Check if window.supabaseClient is available
    if (window.supabaseClient) {
        supabaseClient = window.supabaseClient;
        console.log('[SUBMISSION] Using existing window.supabaseClient');
        return supabaseClient;
    }
    
    // Wait for client to become available
    console.log('[SUBMISSION] Waiting for Supabase client to initialize...');
    
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkClient = () => {
            attempts++;
            
            if (window.supabaseClient) {
                supabaseClient = window.supabaseClient;
                console.log('[SUBMISSION] Supabase client found after waiting');
                resolve(supabaseClient);
            } else if (attempts >= maxAttempts) {
                reject(new Error('Supabase client not available after 5 seconds'));
            } else {
                setTimeout(checkClient, 100);
            }
        };
        
        checkClient();
    });
}

// Initialize the client when the script loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        supabaseClient = await waitForSupabaseClient();
        console.log('[SUBMISSION] Supabase client initialized successfully');
    } catch (error) {
        console.error('[SUBMISSION] Failed to initialize Supabase client:', error);
    }
});

/**
 * Get or create a submission for the current user
 * @param {string} userId - The user ID
 * @returns {Promise<string>} - The submission ID
 */
async function getOrCreateSubmission(userId) {
    try {
        console.log('[SUBMISSION] Getting or creating submission for user:', userId);
        
        // Ensure Supabase client is available
        const client = await waitForSupabaseClient();
        
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Step 1: Try to find an existing draft
        const { data: existing, error: findError } = await client
            .from('auth_submissions')
            .select('id, status')
            .eq('user_id', userId)
            .eq('status', 'draft')
            .limit(1)
            .maybeSingle();

        if (findError) {
            console.error('[SUBMISSION] Error finding existing submission:', findError);
            throw findError;
        }

        if (existing) {
            console.log('[SUBMISSION] Found existing draft submission:', existing.id);
            return existing.id;
        }

        // Step 2: Create a new draft if none found
        const { data: created, error: insertError } = await client
            .from('auth_submissions')
            .insert({
                user_id: userId,
                status: 'draft'
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[SUBMISSION] Error creating new submission:', insertError);
            throw insertError;
        }

        console.log('[SUBMISSION] Created new draft submission:', created.id);
        return created.id;
    } catch (error) {
        console.error('[SUBMISSION] Error in getOrCreateSubmission:', error);
        throw error;
    }
}

/**
 * Finalize a submission and create authentication request
 * @param {string} submissionId - The submission ID
 * @param {string} modelName - The model name
 * @param {Array} photoUrls - Array of photo URLs
 * @returns {Promise<Object>} - The created authentication request
 */
async function finalizeSubmission(submissionId, modelName, photoUrls) {
    try {
        console.log('[SUBMISSION] Finalizing submission:', submissionId);
        console.log('[SUBMISSION] Model name:', modelName);
        console.log('[SUBMISSION] Photo URLs:', photoUrls);
        
        // Ensure Supabase client is available
        const client = await waitForSupabaseClient();
        
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Get current user
        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError || !user) {
            throw new Error('User not authenticated');
        }

        // Step 1: Update auth_submissions status to "completed"
        const { error: updateError } = await client
            .from('auth_submissions')
            .update({ status: 'completed' })
            .eq('id', submissionId)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('[SUBMISSION] Error updating submission status:', updateError);
            throw updateError;
        }

        console.log('[SUBMISSION] Updated submission status to completed');

        // Step 2: Insert new record into authentication_requests
        const { data: request, error: insertError } = await client
            .from('authentication_requests')
            .insert({
                submission_id: submissionId,
                model_name: modelName,
                photo_urls: photoUrls,
                status: 'Pending Review',
                user_id: user.id,
                user_email: user.email
            })
            .select('*')
            .single();

        if (insertError) {
            console.error('[SUBMISSION] Error creating authentication request:', insertError);
            throw insertError;
        }

        console.log('[SUBMISSION] Created authentication request:', request.id);
        return request;
    } catch (error) {
        console.error('[SUBMISSION] Error in finalizeSubmission:', error);
        throw error;
    }
}

/**
 * Get current user ID with fallback for development
 * @returns {Promise<string>} - The user ID
 */
async function getCurrentUserId() {
    try {
        // Ensure Supabase client is available
        const client = await waitForSupabaseClient();
        
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Try Supabase v2 method first
        const { data: { user }, error: userError } = await client.auth.getUser();
        
        if (userError) {
            console.warn('[SUBMISSION] Error getting user with v2 method:', userError);
            
            // Try Supabase v1 method as fallback
            const user = client.auth.user();
            if (user) {
                console.log('[SUBMISSION] Got user with v1 method:', user.id);
                return user.id;
            }
        } else if (user) {
            console.log('[SUBMISSION] Got user with v2 method:', user.id);
            return user.id;
        }

        // For development/testing, use a test user ID
        console.warn('[SUBMISSION] No authenticated user found, using test user ID');
        return 'test-user-id';
    } catch (error) {
        console.error('[SUBMISSION] Error getting current user ID:', error);
        // For development/testing, use a test user ID
        return 'test-user-id';
    }
}

/**
 * Get current submission ID from session storage or create new one
 * @returns {Promise<string>} - The submission ID
 */
async function getCurrentSubmissionId() {
    try {
        // Check if we have a submission ID in session storage
        const storedSubmissionId = sessionStorage.getItem('currentSubmissionId');
        if (storedSubmissionId) {
            console.log('[SUBMISSION] Found submission ID in session storage:', storedSubmissionId);
            return storedSubmissionId;
        }
        
        // If no stored submission ID, get or create one
        const userId = await getCurrentUserId();
        const submissionId = await getOrCreateSubmission(userId);
        
        // Store the submission ID in session storage
        sessionStorage.setItem('currentSubmissionId', submissionId);
        console.log('[SUBMISSION] Stored submission ID in session storage:', submissionId);
        
        return submissionId;
    } catch (error) {
        console.error('[SUBMISSION] Error getting current submission ID:', error);
        throw error;
    }
}

// Export functions for use in other scripts
window.getOrCreateSubmission = getOrCreateSubmission;
window.finalizeSubmission = finalizeSubmission;
window.getCurrentUserId = getCurrentUserId;
window.getCurrentSubmissionId = getCurrentSubmissionId; 