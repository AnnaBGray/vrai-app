/**
 * Admin Support Inbox Management
 * Handles fetching, displaying, and replying to support messages
 */

// State variables
let supportMessages = [];
let currentFilter = 'pending'; // 'pending' or 'resolved'

// Reference to the Supabase client
const supabase = window.supabaseClient;

/**
 * Initialize support inbox when the page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing support inbox...');
    
    // Check if Supabase client is available
    if (!supabase) {
        console.error('❌ Supabase client not available. Check supabase-init.js');
        showErrorState();
        return;
    }

    // Check if we're on the admin page with support tab
    if (!document.querySelector('[data-tab-content="support"]')) {
        return;
    }

    // Add event listeners for tab switching to load support messages when tab is shown
    const supportTabBtn = document.querySelector('.tab-btn[data-tab="support"]');
    if (supportTabBtn) {
        supportTabBtn.addEventListener('click', initSupportInbox);
    }
    
    // Add event listeners for filter buttons
    document.getElementById('filter-pending').addEventListener('click', () => {
        setActiveFilter('pending');
    });
    
    document.getElementById('filter-resolved').addEventListener('click', () => {
        setActiveFilter('resolved');
    });
    
    // Add event listener for refresh button
    document.getElementById('refresh-support').addEventListener('click', () => {
        loadSupportMessages();
    });
    
    // If support tab is already active, initialize
    if (document.querySelector('.tab-btn[data-tab="support"].border-primary-dark')) {
        initSupportInbox();
    }
});

/**
 * Initialize the support inbox
 */
async function initSupportInbox() {
    console.log('Initializing support inbox...');
    await loadSupportMessages();
}

/**
 * Set active filter and update display
 * @param {string} filter - Filter name ('pending' or 'resolved')
 */
function setActiveFilter(filter) {
    // Update UI
    const pendingBtn = document.getElementById('filter-pending');
    const resolvedBtn = document.getElementById('filter-resolved');
    
    if (filter === 'pending') {
        pendingBtn.classList.remove('bg-gray-100', 'text-gray-600');
        pendingBtn.classList.add('bg-blue-100', 'text-blue-800');
        
        resolvedBtn.classList.remove('bg-blue-100', 'text-blue-800');
        resolvedBtn.classList.add('bg-gray-100', 'text-gray-600');
    } else {
        resolvedBtn.classList.remove('bg-gray-100', 'text-gray-600');
        resolvedBtn.classList.add('bg-blue-100', 'text-blue-800');
        
        pendingBtn.classList.remove('bg-blue-100', 'text-blue-800');
        pendingBtn.classList.add('bg-gray-100', 'text-gray-600');
    }
    
    // Update filter and reload messages
    currentFilter = filter;
    displayFilteredMessages();
}

/**
 * Load support messages from Supabase
 */
async function loadSupportMessages() {
    try {
        showLoadingState();
        
        // Fetch support messages without joins
        const { data: messages, error } = await supabase
            .from('support_messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching support messages:', error);
            showErrorState();
            return;
        }
        
        console.log('Fetched support messages:', messages);
        
        // If we have messages, fetch user emails separately
        if (messages && messages.length > 0) {
            // Extract unique user IDs
            const userIds = [...new Set(messages.map(msg => msg.user_id))];
            
            // Fetch user profiles if we have user IDs
            if (userIds.length > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, email')
                    .in('id', userIds);
                
                if (!profilesError && profiles) {
                    // Create a map of user_id to email for quick lookup
                    const userEmailMap = {};
                    profiles.forEach(profile => {
                        userEmailMap[profile.id] = profile.email;
                    });
                    
                    // Attach email to each message
                    messages.forEach(message => {
                        message.userEmail = userEmailMap[message.user_id] || 'Unknown User';
                    });
                    
                    console.log('Added user emails to messages');
                } else {
                    console.error('Error fetching user profiles:', profilesError);
                    // Continue with messages even if we couldn't get emails
                    messages.forEach(message => {
                        message.userEmail = 'Unknown User';
                    });
                }
            }
        }
        
        supportMessages = messages;
        
        // Update stats
        updateSupportStats(messages);
        
        // Display filtered messages
        displayFilteredMessages();
        
    } catch (error) {
        console.error('Error in loadSupportMessages:', error);
        showErrorState();
    }
}

/**
 * Update support statistics
 * @param {Array} messages - Array of support messages
 */
function updateSupportStats(messages) {
    // Count pending tickets
    const pendingCount = messages.filter(msg => msg.status === 'pending').length;
    document.getElementById('open-tickets-count').textContent = pendingCount;
    
    // Count resolved today
    const today = new Date().toISOString().split('T')[0];
    const resolvedToday = messages.filter(msg => {
        if (msg.status !== 'resolved') return false;
        const msgDate = new Date(msg.updated_at || msg.created_at).toISOString().split('T')[0];
        return msgDate === today;
    }).length;
    
    document.getElementById('resolved-today-count').textContent = resolvedToday;
}

/**
 * Display messages based on current filter
 */
function displayFilteredMessages() {
    const filteredMessages = supportMessages.filter(msg => {
        if (currentFilter === 'pending') {
            return msg.status === 'pending';
        } else {
            return msg.status === 'resolved';
        }
    });
    
    if (filteredMessages.length === 0) {
        showEmptyState();
        return;
    }
    
    displayMessages(filteredMessages);
}

/**
 * Display messages in the UI
 * @param {Array} messages - Array of messages to display
 */
function displayMessages(messages) {
    const container = document.getElementById('support-messages-list');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        container.appendChild(messageElement);
    });
    
    // Show messages container
    document.getElementById('support-loading').classList.add('hidden');
    document.getElementById('support-empty').classList.add('hidden');
    document.getElementById('support-error').classList.add('hidden');
    container.classList.remove('hidden');
}

/**
 * Create HTML element for a support message
 * @param {Object} message - Support message object
 * @returns {HTMLElement} - Message element
 */
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = 'bg-white rounded-xl shadow-sm overflow-hidden';
    div.dataset.messageId = message.id;
    
    const userEmail = message.userEmail || 'Unknown User';
    const formattedDate = formatDate(message.created_at);
    const hasReply = message.reply && message.reply.trim().length > 0;
    
    // Message content
    let html = `
        <div class="p-4 border-b border-gray-100">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm">
                        ${getUserInitials(userEmail)}
                    </div>
                    <div class="ml-2">
                        <p class="text-sm font-medium text-gray-900">${userEmail}</p>
                        <p class="text-xs text-gray-500">${formattedDate}</p>
                    </div>
                </div>
                <span class="text-xs font-medium px-2 py-1 rounded-full ${message.status === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                    ${message.status}
                </span>
            </div>
            <div class="text-sm text-gray-700 mt-2">
                ${message.message}
            </div>
        </div>
    `;
    
    // Reply section
    if (hasReply) {
        // Show existing reply
        html += `
            <div class="p-4 bg-gray-50">
                <div class="flex items-center mb-2">
                    <div class="w-6 h-6 rounded-full bg-primary-dark flex items-center justify-center text-white text-xs">
                        A
                    </div>
                    <p class="text-sm font-medium text-gray-900 ml-2">Admin Reply</p>
                </div>
                <div class="text-sm text-gray-700">
                    ${message.reply}
                </div>
            </div>
        `;
    } else if (message.status === 'pending') {
        // Show reply form for pending messages
        html += `
            <div class="p-4 bg-gray-50 reply-form">
                <p class="text-xs font-medium text-gray-700 mb-2">Reply to this message:</p>
                <textarea class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" rows="3" placeholder="Type your reply here..."></textarea>
                <div class="flex justify-end mt-2">
                    <button class="send-reply-btn bg-primary-dark text-white text-xs font-medium py-2 px-4 rounded-lg">
                        Send Reply
                    </button>
                </div>
            </div>
        `;
    }
    
    div.innerHTML = html;
    
    // Add event listener for reply button
    const replyBtn = div.querySelector('.send-reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', async () => {
            const textarea = div.querySelector('textarea');
            const replyText = textarea.value.trim();
            
            if (!replyText) {
                alert('Please enter a reply message.');
                return;
            }
            
            await sendReply(message.id, replyText);
        });
    }
    
    return div;
}

/**
 * Send a reply to a support message
 * @param {string} messageId - ID of the message to reply to
 * @param {string} replyText - Reply text
 */
async function sendReply(messageId, replyText) {
    try {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        const replyForm = messageElement.querySelector('.reply-form');
        const replyBtn = messageElement.querySelector('.send-reply-btn');
        
        // Show loading state
        replyBtn.disabled = true;
        replyBtn.innerHTML = `
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        
        // Update message in Supabase
        const { error } = await supabase
            .from('support_messages')
            .update({
                reply: replyText,
                status: 'resolved',
                updated_at: new Date().toISOString()
            })
            .eq('id', messageId);
        
        if (error) {
            console.error('Error sending reply:', error);
            alert('Failed to send reply. Please try again.');
            replyBtn.disabled = false;
            replyBtn.textContent = 'Send Reply';
            return;
        }
        
        console.log('Reply sent successfully');
        
        // Reload messages
        await loadSupportMessages();
        
    } catch (error) {
        console.error('Error in sendReply:', error);
        alert('Failed to send reply. Please try again.');
    }
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * Get user initials from email
 * @param {string} email - User email
 * @returns {string} - User initials
 */
function getUserInitials(email) {
    if (!email || email === 'Unknown User') return 'U';
    
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return email.substring(0, 2).toUpperCase();
}

/**
 * Show loading state
 */
function showLoadingState() {
    document.getElementById('support-loading').classList.remove('hidden');
    document.getElementById('support-empty').classList.add('hidden');
    document.getElementById('support-error').classList.add('hidden');
    document.getElementById('support-messages-list').classList.add('hidden');
}

/**
 * Show empty state
 */
function showEmptyState() {
    document.getElementById('support-loading').classList.add('hidden');
    document.getElementById('support-empty').classList.remove('hidden');
    document.getElementById('support-error').classList.add('hidden');
    document.getElementById('support-messages-list').classList.add('hidden');
}

/**
 * Show error state
 */
function showErrorState() {
    document.getElementById('support-loading').classList.add('hidden');
    document.getElementById('support-empty').classList.add('hidden');
    document.getElementById('support-error').classList.remove('hidden');
    document.getElementById('support-messages-list').classList.add('hidden');
} 