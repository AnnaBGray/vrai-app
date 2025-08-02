/**
 * Supabase Photo Upload Handler
 * Manages the photo upload process for the authentication flow
 */

// Store submission ID for organizing uploads
let currentSubmissionId = null;

// Store photo URLs per submission ID to prevent mixing
let submissionPhotoUrls = {};

// Debug flag - set to true to enable verbose logging
const DEBUG = true;

/**
 * Log debug information if DEBUG is enabled
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
function debugLog(message, data) {
  if (DEBUG) {
    if (data !== undefined) {
      console.log(`[UPLOAD-DEBUG] ${message}`, data);
    } else {
      console.log(`[UPLOAD-DEBUG] ${message}`);
    }
  }
}

/**
 * Get or initialize photo URLs for a specific submission
 * @param {string} submissionId - The submission ID
 * @returns {Array} - The photoUrls array for this submission
 */
function getSubmissionPhotoUrls(submissionId) {
  if (!submissionId) {
    debugLog('No submission ID provided, returning empty array');
    return Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
  }
  
  if (!submissionPhotoUrls[submissionId]) {
    debugLog(`Initializing photo URLs for submission ${submissionId}`);
    submissionPhotoUrls[submissionId] = Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
  }
  
  debugLog(`Photo URLs for submission ${submissionId}:`, JSON.parse(JSON.stringify(submissionPhotoUrls[submissionId])));
  return submissionPhotoUrls[submissionId];
}

/**
 * Upload a photo to Supabase Storage or directly set a URL
 * @param {File} file - The file object to upload
 * @param {number} stepNumber - The authentication step number (1-10)
 * @param {string} [directUrl] - Optional direct URL to use instead of uploading the file
 * @returns {Promise<string>} - URL of the uploaded file or the direct URL
 */
async function uploadPhoto(file, stepNumber, directUrl) {
  // Force stepNumber to be a number to prevent type conversion issues
  stepNumber = Number(stepNumber);
  
  debugLog(`Starting upload for step ${stepNumber}`);
  debugLog(`Step number type: ${typeof stepNumber}, value: ${stepNumber}`);
  
  try {
    // Validate step number
    if (stepNumber < 1 || stepNumber > 10) {
      const error = new Error('Step number must be between 1 and 10');
      debugLog('Validation error:', error);
      throw error;
    }
    
    // Validate submission ID is set
    if (!currentSubmissionId) {
      const error = new Error('No submission ID set. Please set submission ID before uploading photos. This prevents photo overlap between different submissions.');
      debugLog('Validation error:', error);
      
      // Show user-friendly error message
      const errorMessage = 'Submission ID is missing. Please refresh the page and start the authentication process from step 1.';
      if (typeof alert !== 'undefined') {
        alert(errorMessage);
      }
      
      throw error;
    }
    
    debugLog(`Using submission ID: ${currentSubmissionId}`);
    
    // Get photo URLs for this submission
    const photoUrls = getSubmissionPhotoUrls(currentSubmissionId);
    
    let publicUrl;
    
    // Validate that either file or directUrl is provided
    if (!file && !directUrl) {
      const error = new Error('Either file or directUrl must be provided');
      debugLog('Validation error:', error);
      throw error;
    }
    
    // If directUrl is provided, use it directly without uploading
    if (directUrl) {
      debugLog(`[UPLOAD] Step ${stepNumber}: Assigned directUrl ${directUrl}`);
      publicUrl = directUrl;
    } else {
      // Otherwise, proceed with file upload
      if (!(file instanceof File)) {
        const error = new Error('Invalid file object');
        debugLog('Validation error:', error);
        throw error;
      }
      
      debugLog(`File details:`, {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      // Generate unique filename using crypto.randomUUID()
      const uniqueId = crypto.randomUUID();
      const fileExt = file.name.split('.').pop();
      
      // Use submission ID in the path
      const fileName = `${currentSubmissionId}/step${stepNumber}-${uniqueId}.${fileExt}`;
      debugLog(`Generated filename: ${fileName}`);
      
      // Get Supabase client from the global scope
      let supabase = window.supabaseClient;
      if (!supabase) {
        // Wait for client to be available
        debugLog('Supabase client not found, waiting...');
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        while (!supabase && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          supabase = window.supabaseClient;
          attempts++;
        }
        
        if (!supabase) {
          const error = new Error('Supabase client not initialized after waiting');
          debugLog('Supabase error:', error);
          throw error;
        }
        
        debugLog('Supabase client found after waiting');
      }
      
      debugLog('Supabase client found, proceeding with upload');
      
      // Upload to the auth-photos bucket
      debugLog(`Uploading to bucket: auth-photos`);
      const { data, error } = await supabase.storage
        .from('auth-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        debugLog('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      debugLog('Upload successful, getting public URL');
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('auth-photos')
        .getPublicUrl(fileName);
        
      publicUrl = urlData.publicUrl;
      debugLog(`Public URL generated: ${publicUrl}`);
    }
    
    // Store URL in the submission-specific photoUrls array
    debugLog(`Storing URL in photoUrls array at index ${stepNumber < 10 ? stepNumber - 1 : '9 (array)'}`);
    
    // Make a copy of the current state for logging
    const beforeState = JSON.parse(JSON.stringify(photoUrls));
    
    if (stepNumber < 10) {
      // For steps 1-9, store as single string
      const oldUrl = photoUrls[stepNumber - 1];
      photoUrls[stepNumber - 1] = publicUrl;
      debugLog(`[UPLOAD] Step ${stepNumber}: Updated photoUrls[${stepNumber - 1}]`);
      debugLog(`[UPLOAD] Old value: ${oldUrl || 'null'}`);
      debugLog(`[UPLOAD] New value: ${publicUrl}`);
    } else {
      // For step 10, append to array if not already present
      const beforeLength = photoUrls[9].length;
      
      // Check for duplicates
      const isDuplicate = photoUrls[9].includes(publicUrl);
      if (isDuplicate) {
        debugLog(`[UPLOAD] Step 10: URL already exists in array, skipping: ${publicUrl}`);
      } else {
        photoUrls[9].push(publicUrl);
        debugLog(`[UPLOAD] Step 10: Added to photoUrls[9] array (now ${photoUrls[9].length} items)`);
        debugLog(`[UPLOAD] Added URL: ${publicUrl}`);
      }
    }
    
    // Update the submission-specific storage
    submissionPhotoUrls[currentSubmissionId] = photoUrls;
    
    // Log the before and after state
    debugLog('photoUrls before update:', beforeState);
    debugLog('photoUrls after update:', JSON.parse(JSON.stringify(photoUrls)));
    
    return publicUrl;
  } catch (error) {
    debugLog('Error in uploadPhoto:', error);
    throw error;
  }
}

/**
 * Check if all required photos are uploaded for the current submission
 * @returns {boolean} - True if all required photos are uploaded
 */
function validatePhotos() {
  debugLog('Validating photos for current submission');
  
  if (!currentSubmissionId) {
    debugLog('No submission ID set, validation failed');
    return false;
  }
  
  const photoUrls = getSubmissionPhotoUrls(currentSubmissionId);
  
  // Check if steps 1-9 all have photos (indices 0-8)
  for (let i = 0; i < 9; i++) {
    if (!photoUrls[i]) {
      debugLog(`Validation failed: Missing photo for step ${i+1} (index ${i})`);
      return false;
    }
  }
  
  debugLog('All required photos are present');
  return true;
}

/**
 * Set the current submission ID for organizing uploads
 * @param {string} submissionId - The submission ID
 */
function setSubmissionId(submissionId) {
  if (!submissionId || typeof submissionId !== 'string') {
    debugLog('Invalid submission ID provided:', submissionId);
    throw new Error('Valid submission ID is required');
  }
  
  currentSubmissionId = submissionId;
  debugLog(`Submission ID set to: ${submissionId}`);
  
  // Initialize photo URLs for this submission if not already done
  if (!submissionPhotoUrls[submissionId]) {
    debugLog(`Initializing photo URLs for new submission: ${submissionId}`);
    submissionPhotoUrls[submissionId] = Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
  }
  
  // Store in session storage for persistence
  try {
    sessionStorage.setItem('currentSubmissionId', submissionId);
    debugLog(`Stored submission ID in session storage: ${submissionId}`);
  } catch (error) {
    debugLog('Failed to store submission ID in session storage:', error);
  }
}

/**
 * Get the current submission ID
 * @returns {string|null} - The current submission ID
 */
function getSubmissionId() {
  return currentSubmissionId;
}

/**
 * Submit authentication request to Supabase
 * @param {string} modelName - The model name provided by user
 * @param {Object} additionalData - Any additional data to include
 * @returns {Promise<Object>} - Result of the submission
 */
async function submitAuthenticationRequest(modelName, additionalData = {}) {
  debugLog('Starting submission process');
  debugLog('Model name:', modelName);
  debugLog('Additional data:', additionalData);
  
  try {
    // Validate required fields
    if (!modelName) {
      const error = new Error('Model name is required');
      debugLog('Validation error:', error);
      throw error;
    }
    
    if (!validatePhotos()) {
      const error = new Error('All photos for steps 1-9 must be uploaded');
      debugLog('Validation error:', error);
      throw error;
    }
    
    let supabase = window.supabaseClient;
    if (!supabase) {
      // Wait for client to be available
      debugLog('Supabase client not found, waiting...');
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while (!supabase && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        supabase = window.supabaseClient;
        attempts++;
      }
      
      if (!supabase) {
        const error = new Error('Supabase client not initialized after waiting');
        debugLog('Supabase error:', error);
        throw error;
      }
      
      debugLog('Supabase client found after waiting');
    }
    
    // Get user ID from session
    debugLog('Getting user from auth session');
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) {
      const error = new Error('User not authenticated');
      debugLog('Auth error:', error);
      throw error;
    }
    
    debugLog('User authenticated:', userId);
    
    // Get photo URLs for current submission
    const photoUrls = getSubmissionPhotoUrls(currentSubmissionId);
    
    // Prepare data for submission
    const submissionData = {
      user_id: userId,
      model_name: modelName,
      photo_urls: photoUrls,
      status: 'Pending Review',
      created_at: new Date().toISOString(),
      ...additionalData
    };
    
    debugLog('Submission data prepared:', submissionData);
    
    // Submit to authentication_requests table
    debugLog('Submitting to authentication_requests table');
    const { data, error } = await supabase
      .from('authentication_requests')
      .insert([submissionData])
      .select();
      
    if (error) {
      debugLog('Submission error:', error);
      throw new Error(`Submission failed: ${error.message}`);
    }
    
    debugLog('Submission successful:', data);
    return data;
  } catch (error) {
    debugLog('Error in submitAuthenticationRequest:', error);
    throw error;
  }
}

/**
 * Reset the photo upload state for the current submission
 */
function resetPhotoState() {
  debugLog('Resetting photo state for current submission');
  
  if (!currentSubmissionId) {
    debugLog('No submission ID set, nothing to reset');
    return;
  }
  
  const beforeState = JSON.parse(JSON.stringify(submissionPhotoUrls[currentSubmissionId] || []));
  
  submissionPhotoUrls[currentSubmissionId] = Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
  
  debugLog('photoUrls before reset:', beforeState);
  debugLog('photoUrls after reset:', JSON.parse(JSON.stringify(submissionPhotoUrls[currentSubmissionId])));
}

/**
 * Get the current state of uploaded photos for the current submission
 * @returns {Array} - The photoUrls array for the current submission
 */
function getPhotoUrls() {
  debugLog('Getting photoUrls array for current submission');
  
  if (!currentSubmissionId) {
    debugLog('No submission ID set, returning empty array');
    console.error('[UPLOAD-ERROR] No submission ID set - this will cause photo overlap issues');
    return Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
  }
  
  const photoUrls = getSubmissionPhotoUrls(currentSubmissionId);
  debugLog('Current photoUrls state:', JSON.parse(JSON.stringify(photoUrls)));
  return [...photoUrls];
}

/**
 * Load photos for a specific submission from Supabase Storage
 * @param {string} submissionId - The submission ID to load photos for
 * @returns {Promise<Array>} - Array of photo URLs for the submission
 */
async function loadSubmissionPhotos(submissionId) {
  debugLog(`Loading photos for submission ${submissionId}`);
  
  try {
    if (!submissionId) {
      debugLog('No submission ID provided');
      return Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
    }
    
    let supabase = window.supabaseClient;
    if (!supabase) {
      debugLog('Supabase client not found, waiting...');
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!supabase && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        supabase = window.supabaseClient;
        attempts++;
      }
      
      if (!supabase) {
        throw new Error('Supabase client not initialized after waiting');
      }
    }
    
    // List files in the submission folder
    const { data: files, error } = await supabase.storage
      .from('auth-photos')
      .list(submissionId, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      debugLog('Error listing files:', error);
      return Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
    }
    
    if (!files || files.length === 0) {
      debugLog('No files found for submission');
      return Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
    }
    
    debugLog(`Found ${files.length} files for submission ${submissionId}`);
    
    // Initialize photo URLs array
    const photoUrls = Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
    
    // Process each file
    for (const file of files) {
      if (file.id === null) continue; // Skip folders
      
      // Look for step#- pattern in filename
      const match = file.name.match(/^step(\d+)-/);
      if (match) {
        const stepNum = parseInt(match[1]);
        
        if (stepNum >= 1 && stepNum <= 10) {
          const filePath = `${submissionId}/${file.name}`;
          
          try {
            const { data: urlData } = supabase.storage
              .from('auth-photos')
              .getPublicUrl(filePath);
              
            if (urlData && urlData.publicUrl) {
              if (stepNum < 10) {
                photoUrls[stepNum - 1] = urlData.publicUrl;
                debugLog(`Loaded step ${stepNum} photo: ${file.name}`);
              } else {
                photoUrls[9].push(urlData.publicUrl);
                debugLog(`Loaded step 10 photo: ${file.name}`);
              }
            }
          } catch (urlError) {
            debugLog(`Error getting URL for ${filePath}:`, urlError);
          }
        }
      }
    }
    
    // Store the loaded photos for this submission
    submissionPhotoUrls[submissionId] = photoUrls;
    
    debugLog(`Loaded photos for submission ${submissionId}:`, JSON.parse(JSON.stringify(photoUrls)));
    return photoUrls;
    
  } catch (error) {
    debugLog('Error loading submission photos:', error);
    return Array(10).fill(null).map((_, i) => i === 9 ? [] : null);
  }
}

// Export functions for use in authentication steps
window.photoUploader = {
  uploadPhoto,
  validatePhotos,
  submitAuthenticationRequest,
  resetPhotoState,
  getPhotoUrls,
  setSubmissionId,
  getSubmissionId,
  loadSubmissionPhotos
};

// Log that the module has been initialized
debugLog('Supabase Upload module initialized'); 