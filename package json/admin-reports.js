/**
 * Admin Reports - Handles problem reports display in the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin page and the report tab is available
    const reportTab = document.querySelector('[data-tab-content="report"]');
    if (!reportTab) return;
    
    // Check Supabase client initialization
    console.log('🔍 Checking Supabase client on page load...');
    
    // Try to get the Supabase client
    const supabase = window.supabaseClient;
    
    if (!supabase) {
        console.error('❌ Supabase client not initialized on page load');
        
        // Try to initialize it if it's not available
        if (typeof supabaseUrl !== 'undefined' && typeof supabaseKey !== 'undefined') {
            console.log('🔄 Attempting to initialize Supabase client...');
            try {
                window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                console.log('✅ Supabase client initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize Supabase client:', error);
            }
        } else {
            console.error('❌ Supabase URL or key not available');
        }
    } else {
        console.log('✅ Supabase client already initialized:', {
            type: typeof supabase,
            hasFrom: typeof supabase.from === 'function'
        });
    }

    // Initialize variables
    const reportsContainer = document.getElementById('problem-reports-container');
    const reportsList = document.getElementById('problem-reports-list');
    const loadingState = document.getElementById('reports-loading');
    const emptyState = document.getElementById('reports-empty');
    const errorState = document.getElementById('reports-error');
    const totalReportsCount = document.getElementById('total-reports-count');
    const pendingReportsCount = document.getElementById('pending-reports-count');

    // Add event listener for tab switching to load reports when the Report tab is selected
    const reportTabButton = document.querySelector('.tab-btn[data-tab="report"]');
    if (reportTabButton) {
        reportTabButton.addEventListener('click', loadProblemReports);
    }

    /**
     * Load problem reports from Supabase
     */
    async function loadProblemReports() {
        // Show loading state
        showLoadingState();
        
        try {
            // Get Supabase client from global variable
            const supabase = window.supabaseClient;
            
            // Log Supabase client details for debugging
            console.log('📝 Supabase client check:', {
                exists: !!supabase,
                hasFrom: supabase && typeof supabase.from === 'function',
                type: supabase ? typeof supabase : 'undefined'
            });
            
            if (!supabase) {
                console.error('❌ Supabase client not available');
                showErrorState();
                return;
            }
            
            if (typeof supabase.from !== 'function') {
                console.error('❌ Supabase client missing .from() method');
                showErrorState();
                return;
            }
            
            // Fetch problem reports
            console.log('📝 Fetching problem reports...');
            const { data: reports, error } = await supabase
                .from('problem_reports')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error fetching problem reports:', error);
                showErrorState();
                return;
            }
            
            console.log('📊 Problem reports loaded:', reports);
            
            // Log the first report to check its structure
            if (reports && reports.length > 0) {
                console.log('📝 Sample report structure:', {
                    id: reports[0].id,
                    hasId: 'id' in reports[0],
                    idType: typeof reports[0].id
                });
            }
            
            // Update stats
            updateStats(reports);
            
            // Display reports
            displayReports(reports);
            
        } catch (error) {
            console.error('❌ Error in loadProblemReports:', error);
            showErrorState();
        }
    }

    /**
     * Display problem reports in the UI
     * @param {Array} reports - Array of problem report objects
     */
    function displayReports(reports) {
        // Clear previous reports
        reportsList.innerHTML = '';
        
        if (!reports || reports.length === 0) {
            showEmptyState();
            return;
        }
        
        // Add each report
        reports.forEach(report => {
            const reportElement = createReportElement(report);
            reportsList.appendChild(reportElement);
        });
        
        // Show reports list
        loadingState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        reportsList.classList.remove('hidden');
    }

    /**
     * Create a report element
     * @param {Object} report - Report object
     * @returns {HTMLElement} - Report element
     */
    function createReportElement(report) {
        const reportDiv = document.createElement('div');
        reportDiv.className = 'bg-white rounded-xl p-4 shadow-sm';
        
        // Format created_at date
        const createdDate = new Date(report.created_at);
        const formattedDate = formatDate(createdDate);
        
        // Format reply_time date if it exists
        let replyTimeFormatted = '';
        if (report.reply_time) {
            const replyDate = new Date(report.reply_time);
            replyTimeFormatted = formatDate(replyDate);
        }
        
        // Create status badge
        const statusBadge = getStatusBadge(report.status || 'pending');
        
        // Check if there are uploaded files
        const hasFiles = report.uploaded_file_url && report.uploaded_file_url.length > 0;
        
        // Create a unique ID for this report's reply section
        const replyContainerId = `reply-container-${report.id}`;
        const replyTextareaId = `reply-textarea-${report.id}`;
        const replySendBtnId = `reply-send-${report.id}`;
        
        // Create HTML for the report
        reportDiv.innerHTML = `
            <div class="flex flex-col space-y-3">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-sm font-medium text-gray-900">${escapeHtml(report.full_name)}</h3>
                        <p class="text-xs text-gray-500">${escapeHtml(report.email)}</p>
                    </div>
                    ${statusBadge}
                </div>
                
                <div class="space-y-2">
                    <div class="flex space-x-2">
                        <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">${escapeHtml(report.problem_type || 'General')}</span>
                        ${report.submission_id ? `<span class="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">ID: ${escapeHtml(report.submission_id)}</span>` : ''}
                    </div>
                    
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(report.description)}</p>
                    
                    ${hasFiles ? createFileLinks(report.uploaded_file_url) : ''}
                </div>
                
                <div class="text-xs text-gray-500">
                    ${formattedDate}
                </div>
                
                ${report.admin_reply ? `
                    <!-- Admin Reply Section -->
                    <div class="mt-2 pt-3 border-t border-gray-100">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-xs font-medium text-gray-700">Admin Reply:</span>
                            <span class="text-xs text-gray-500">${replyTimeFormatted}</span>
                        </div>
                        <p class="text-sm text-gray-700 whitespace-pre-wrap">${escapeHtml(report.admin_reply)}</p>
                    </div>
                ` : `
                    <!-- Reply Button and Form -->
                    <div class="pt-2">
                        <button id="reply-btn-${report.id}" class="text-xs font-medium text-primary hover:text-primary-dark">
                            Reply
                        </button>
                        
                        <div id="${replyContainerId}" class="mt-2 hidden">
                            <textarea id="${replyTextareaId}" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows="3" placeholder="Type your reply here..."></textarea>
                            
                            <div class="flex justify-end mt-2">
                                <button id="${replySendBtnId}" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-gray-800 bg-primary hover:bg-primary-dark">
                                    Send Reply
                                </button>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        `;
        
        // Add event listeners after a short delay to ensure the element exists in DOM
        setTimeout(() => {
            // Only add event listeners if there's no admin reply yet
            if (!report.admin_reply) {
                // Reply button click handler
                const replyBtn = reportDiv.querySelector(`#reply-btn-${report.id}`);
                const replyContainer = reportDiv.querySelector(`#${replyContainerId}`);
                
                if (replyBtn && replyContainer) {
                    replyBtn.addEventListener('click', function() {
                        // Toggle reply container visibility
                        replyContainer.classList.toggle('hidden');
                        replyBtn.classList.toggle('hidden');
                    });
                }
                
                // Send button click handler
                const sendBtn = reportDiv.querySelector(`#${replySendBtnId}`);
                const textarea = reportDiv.querySelector(`#${replyTextareaId}`);
                
                if (sendBtn && textarea) {
                    sendBtn.addEventListener('click', async function() {
                        const replyText = textarea.value.trim();
                        
                        if (!replyText) {
                            alert('Please enter a reply message.');
                            return;
                        }
                        
                        // Disable button and show loading state
                        sendBtn.disabled = true;
                        sendBtn.innerHTML = 'Sending...';
                        
                        try {
                            // Log the report object for debugging
                            console.log('📝 Report object:', report);
                            console.log('📝 Report ID type:', typeof report.id);
                            console.log('📝 Report ID value:', report.id);
                            
                            // Call submitReply with the report ID
                            const result = await submitReply(report.id, replyText);
                            
                            // Show success message
                            const successMsg = document.createElement('div');
                            successMsg.className = 'mt-2 px-3 py-2 bg-green-50 text-green-700 text-xs rounded-md';
                            successMsg.innerHTML = 'Reply sent successfully!';
                            
                            // Replace the textarea and send button with success message
                            replyContainer.innerHTML = '';
                            replyContainer.appendChild(successMsg);
                            
                            // Hide success message and reload reports after a delay
                            setTimeout(() => {
                                // Reload reports to show the updated data
                                loadProblemReports();
                            }, 2000);
                            
                        } catch (error) {
                            console.error('❌ Error submitting reply:', error);
                            alert(`Failed to send reply: ${error.message}`);
                            
                            // Re-enable button
                            sendBtn.disabled = false;
                            sendBtn.innerHTML = 'Send Reply';
                        }
                    });
                }
            }
        }, 100);
        
        return reportDiv;
    }

    /**
     * Create file links for viewing images
     * @param {Array} fileUrls - Array of file URLs
     * @returns {string} - HTML for file links
     */
    function createFileLinks(fileUrls) {
        if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
            return '';
        }
        
        // Create a unique ID for this button
        const buttonId = 'view-images-' + Math.random().toString(36).substring(2, 10);
        
        // Create a button to view all images
        const buttonHtml = `
            <div class="mt-2">
                <button 
                    id="${buttonId}"
                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-gray-800 bg-primary hover:bg-primary-dark"
                >
                    <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Tap to View ${fileUrls.length > 1 ? `(${fileUrls.length} images)` : ''}
                </button>
            </div>
        `;
        
        // Add event listener after a short delay to ensure the element exists in DOM
        setTimeout(() => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', function() {
                    showImagePreview(fileUrls);
                });
            }
        }, 100);
        
        return buttonHtml;
    }

    /**
     * Get status badge HTML
     * @param {string} status - Status string
     * @returns {string} - HTML for status badge
     */
    function getStatusBadge(status) {
        let color, text;
        
        switch (status.toLowerCase()) {
            case 'resolved':
                color = 'bg-green-100 text-green-800';
                text = 'Resolved';
                break;
            case 'in_progress':
                color = 'bg-blue-100 text-blue-800';
                text = 'In Progress';
                break;
            case 'rejected':
                color = 'bg-red-100 text-red-800';
                text = 'Rejected';
                break;
            case 'pending':
            default:
                color = 'bg-yellow-100 text-yellow-800';
                text = 'Pending';
                break;
        }
        
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}">${text}</span>`;
    }

    /**
     * Update stats display
     * @param {Array} reports - Array of problem report objects
     */
    function updateStats(reports) {
        if (!reports) return;
        
        // Update total count
        totalReportsCount.textContent = reports.length;
        
        // Count pending reports
        const pendingCount = reports.filter(report => 
            !report.status || report.status.toLowerCase() === 'pending'
        ).length;
        
        pendingReportsCount.textContent = pendingCount;
    }

    /**
     * Format date in a nice readable format
     * @param {Date} date - Date object
     * @returns {string} - Formatted date string
     */
    function formatDate(date) {
        if (!date || !(date instanceof Date) || isNaN(date)) {
            return 'Invalid date';
        }
        
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        const diffInDays = diffInHours / 24;
        
        if (diffInHours < 1) {
            const minutes = Math.floor((now - date) / (1000 * 60));
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
            const days = Math.floor(diffInDays);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString([], { 
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) + ' at ' + date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        reportsList.classList.add('hidden');
    }

    /**
     * Show empty state
     */
    function showEmptyState() {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        errorState.classList.add('hidden');
        reportsList.classList.add('hidden');
    }

    /**
     * Show error state
     */
    function showErrorState() {
        loadingState.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.remove('hidden');
        reportsList.classList.add('hidden');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} unsafe - Unsafe HTML string
     * @returns {string} - Escaped HTML string
     */
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Submit admin reply to a problem report
     * @param {string|number} reportId - ID of the problem report
     * @param {string} replyText - Admin reply text
     * @returns {Promise} - Promise that resolves when the reply is submitted
     */
    async function submitReply(reportId, replyText) {
        try {
            // Get Supabase client
            const supabase = window.supabaseClient;
            
            if (!supabase) {
                throw new Error('Supabase client not available');
            }

            // Log the report ID and reply text for debugging
            console.log('📝 Submitting reply for report ID:', reportId);
            console.log('📝 Reply text:', replyText);
            
            // Make sure reportId is a valid UUID or number
            if (!reportId) {
                throw new Error('Invalid report ID');
            }
            
            // Current timestamp
            const timestamp = new Date().toISOString();
            
            // Prepare update payload
            const updatePayload = {
                admin_reply: replyText,
                reply_time: timestamp,
                status: 'resolved'
            };
            
            console.log('📝 Update payload:', updatePayload);
            
            // Update the problem report with admin reply and timestamp
            const { data, error, count } = await supabase
                .from('problem_reports')
                .update(updatePayload)
                .eq('id', reportId)
                .select();
            
            // Log the response for debugging
            console.log('📝 Supabase update response:', { data, error, count });
            
            if (error) {
                console.error('❌ Error updating problem report:', error);
                throw new Error(`Failed to submit reply: ${error.message}`);
            }
            
            // Check if any rows were affected
            if (!data || data.length === 0) {
                console.warn('⚠️ No rows were updated. Report may not exist with ID:', reportId);
                
                // Try to fetch the report to see if it exists
                const { data: checkData, error: checkError } = await supabase
                    .from('problem_reports')
                    .select('id')
                    .eq('id', reportId)
                    .single();
                
                console.log('📝 Report check result:', { checkData, checkError });
                
                if (checkError || !checkData) {
                    throw new Error(`Report with ID ${reportId} not found`);
                } else {
                    throw new Error(`Report found but update failed for unknown reason`);
                }
            }
            
            console.log('✅ Reply submitted successfully:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error in submitReply:', error);
            throw error;
        }
    }
});

/**
 * Global function to show image preview modal
 * @param {Array} imageUrls - Array of image URLs to display
 */
window.showImagePreview = function(imageUrls) {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.error('No images to display');
        return;
    }

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75';
    modal.id = 'image-preview-modal';
    
    // Create modal content
    let modalContent = `
        <div class="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b">
                <h3 class="text-lg font-semibold text-gray-900">
                    Image Preview ${imageUrls.length > 1 ? `(1/${imageUrls.length})` : ''}
                </h3>
                <button id="close-preview" class="text-gray-400 hover:text-gray-500">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Image container -->
            <div class="flex-1 overflow-auto p-4">
                <div id="image-preview-container" class="flex flex-col items-center space-y-4">
                    ${imageUrls.map((url, index) => `
                        <div class="image-item ${index > 0 ? 'hidden' : ''}" data-index="${index}">
                            <img src="${url}" alt="Preview image ${index + 1}" class="max-w-full max-h-[60vh] object-contain">
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Navigation buttons (only show if multiple images) -->
            ${imageUrls.length > 1 ? `
                <div class="flex items-center justify-between p-4 border-t">
                    <button id="prev-image" class="px-3 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200">
                        Previous
                    </button>
                    <span id="image-counter" class="text-sm text-gray-500">1/${imageUrls.length}</span>
                    <button id="next-image" class="px-3 py-1 bg-primary rounded-md text-sm font-medium text-gray-800 hover:bg-primary-dark">
                        Next
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    // Set modal content
    modal.innerHTML = modalContent;
    
    // Append modal to body
    document.body.appendChild(modal);
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
    
    // Current image index (for navigation)
    let currentIndex = 0;
    
    // Handle close button
    const closeButton = document.getElementById('close-preview');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    // Handle click outside modal to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Handle escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowRight' && imageUrls.length > 1) {
            showNextImage();
        } else if (e.key === 'ArrowLeft' && imageUrls.length > 1) {
            showPrevImage();
        }
    });
    
    // Handle navigation buttons
    if (imageUrls.length > 1) {
        const prevButton = document.getElementById('prev-image');
        const nextButton = document.getElementById('next-image');
        
        if (prevButton) prevButton.addEventListener('click', showPrevImage);
        if (nextButton) nextButton.addEventListener('click', showNextImage);
    }
    
    /**
     * Close the modal
     */
    function closeModal() {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', closeModal);
    }
    
    /**
     * Show the next image
     */
    function showNextImage() {
        const images = document.querySelectorAll('.image-item');
        if (!images.length) return;
        
        // Hide current image
        images[currentIndex].classList.add('hidden');
        
        // Calculate next index
        currentIndex = (currentIndex + 1) % imageUrls.length;
        
        // Show next image
        images[currentIndex].classList.remove('hidden');
        
        // Update counter
        const counter = document.getElementById('image-counter');
        if (counter) counter.textContent = `${currentIndex + 1}/${imageUrls.length}`;
        
        // Update title
        const title = document.querySelector('#image-preview-modal h3');
        if (title) title.textContent = `Image Preview (${currentIndex + 1}/${imageUrls.length})`; 
    }
    
    /**
     * Show the previous image
     */
    function showPrevImage() {
        const images = document.querySelectorAll('.image-item');
        if (!images.length) return;
        
        // Hide current image
        images[currentIndex].classList.add('hidden');
        
        // Calculate previous index
        currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
        
        // Show previous image
        images[currentIndex].classList.remove('hidden');
        
        // Update counter
        const counter = document.getElementById('image-counter');
        if (counter) counter.textContent = `${currentIndex + 1}/${imageUrls.length}`;
        
        // Update title
        const title = document.querySelector('#image-preview-modal h3');
        if (title) title.textContent = `Image Preview (${currentIndex + 1}/${imageUrls.length})`; 
    }
};
