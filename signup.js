/**
 * Signup Form Handler - Production Ready with Supabase Auth
 * Handles form validation, Supabase submission, and user feedback with inline messages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const signupForm = document.getElementById('signupForm');
    const messageElement = document.getElementById('message');
    const fullNameInput = document.getElementById('fullName');
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    // International phone input instance
    let iti;
    
    // Get Supabase client from global variable
    const supabase = window.supabaseClient;
    
    // Check if Supabase client is available
    if (supabase) {
        // Check if user is already logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // User is already logged in, redirect to dashboard
                redirectToDashboard(session.user);
            }
        });
    } else {
        console.error('Supabase client not available. Make sure the Supabase script is loaded.');
        showMessage('Error initializing authentication. Please refresh the page.', 'error');
        }
    
    // Function to redirect user to appropriate dashboard
    function redirectToDashboard(user) {
        if (!supabase) return;
    
        // Get user profile from profiles table
        supabase
            .from('profiles')
            .select('is_admin, display_name')
            .eq('id', user.id)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching user profile:', error);
                    window.location.href = 'dashboard.html';
                    return;
                }
                
                const isAdmin = data?.is_admin || false;
                const displayName = data?.display_name || 'User';
                
                // Store user info in localStorage
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userId', user.id);
                localStorage.setItem('displayName', displayName);
                localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
                
                // Redirect to appropriate dashboard
                window.location.href = isAdmin ? 'dashboard-admin.html' : 'dashboard.html';
            });
    }
    
    /**
     * Display inline message with appropriate styling
     */
    function showMessage(message, type = 'error') {
        if (!messageElement) return;
        
        // Clear existing classes
        messageElement.className = 'p-4 rounded-lg text-sm font-medium transition-all duration-200';
        
        // Add type-specific styling
        if (type === 'success') {
            messageElement.classList.add('bg-green-50', 'text-green-800', 'border', 'border-green-200');
        } else if (type === 'error') {
            messageElement.classList.add('bg-red-50', 'text-red-800', 'border', 'border-red-200');
        } else if (type === 'info') {
            messageElement.classList.add('bg-blue-50', 'text-blue-800', 'border', 'border-blue-200');
        }
        
        // Set message and show
        messageElement.textContent = message;
        messageElement.classList.remove('hidden');
        
        // Scroll to message for better visibility
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Hide the message element
     */
    function hideMessage() {
        if (messageElement) {
            messageElement.classList.add('hidden');
        }
    }

    /**
     * Clear message and hide element
     */
    function clearMessage() {
        hideMessage();
        if (messageElement) {
            messageElement.textContent = '';
        }
    }
    
    /**
     * Initialize International Phone Input with country detection
     * Uses ipinfo.io for automatic country detection with fallback to US
     */
    async function initializePhoneInput() {
        // Initialize intl-tel-input with proper country detection
        try {
            console.log('🔧 Initializing phone input with auto country detection');
            
            // Wait for DOM to be fully ready and ensure intlTelInput is available
            if (typeof window.intlTelInput !== 'function') {
                console.error('❌ intlTelInput not loaded properly');
                return;
            }
            
            // Initialize intl-tel-input with geoIpLookup using ipinfo.io
            iti = window.intlTelInput(phoneInput, {
                initialCountry: "auto",
                separateDialCode: true,
                preferredCountries: ['us', 'gb', 'ca', 'au'],
                geoIpLookup: function(success, failure) {
                    console.log('🌍 Detecting user location...');
                    
                    // Use ipinfo.io API to detect user's country
                    fetch("https://ipinfo.io/json?token=eeba6ab611395d")
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(resp => {
                            console.log('📍 Location data received:', resp);
                            
                            if (resp.country && typeof resp.country === 'string' && resp.country.length === 2) {
                                const countryCode = resp.country.toLowerCase();
                                console.log(`✅ Country detected: ${countryCode.toUpperCase()}`);
                                success(countryCode);
        } else {
                                console.warn('⚠️ Invalid country data received, using fallback (US)');
                                success('us');
                            }
                        })
                        .catch(error => {
                            console.warn('⚠️ Country detection failed:', error.message);
                            console.log('🔄 Using fallback country: US');
                            success('us');
                        });
                },
                utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@16.0.8/build/js/utils.js"
            });
            
            // Verify initialization was successful
            if (!iti) {
                throw new Error('Failed to create intlTelInput instance');
            }
            
            // Add responsive styling classes to the container
            const phoneContainer = phoneInput.parentElement;
            phoneContainer.classList.add('iti-container');
            
            // Style the intl-tel-input container for better responsiveness
            const itiContainer = phoneInput.closest('.iti');
            if (itiContainer) {
                itiContainer.style.width = '100%';
                itiContainer.style.display = 'block';
            }
            
            // Add event listeners for better user experience and validation
            phoneInput.addEventListener('countrychange', function() {
                const countryData = iti.getSelectedCountryData();
                console.log('📞 Country changed to:', countryData.name);
                
                // Clear any validation errors when country changes
                clearPhoneValidationState();
                
                // Update placeholder based on selected country
                phoneInput.placeholder = iti.getSelectedCountryData().name 
                    ? `Enter ${countryData.name} phone number`
                    : 'Enter phone number';
            });

            // Real-time validation on input
            phoneInput.addEventListener('input', function() {
                clearPhoneValidationState();
                
                // Debounced validation
                clearTimeout(phoneInput.validationTimer);
                phoneInput.validationTimer = setTimeout(() => {
                    if (phoneInput.value.trim() && iti.isValidNumber()) {
                        setPhoneValidationState('success');
                    } else if (phoneInput.value.trim()) {
                        setPhoneValidationState('error');
                    }
                }, 500);
            });
            
            // Clear validation state on focus
            phoneInput.addEventListener('focus', function() {
                clearPhoneValidationState();
            });
            
            console.log('✅ Phone input initialized successfully');
            
        } catch (initError) {
            console.error('❌ Failed to initialize phone input:', initError);
            
            // Fallback to basic input if intl-tel-input fails
            showMessage('Phone input could not be fully initialized. Basic phone input is available.', 'info');
            
            // Add basic styling to phone input for fallback
            phoneInput.style.paddingLeft = '12px';
            phoneInput.style.paddingRight = '12px';
            phoneInput.placeholder = 'Enter your phone number with country code (e.g., +1234567890)';
        }
    }
    
    /**
     * Set phone input validation state
     */
    function setPhoneValidationState(state) {
        const itiContainer = phoneInput.closest('.iti');
        if (itiContainer) {
            itiContainer.classList.remove('has-error', 'has-success');
            if (state === 'error') {
                itiContainer.classList.add('has-error');
            } else if (state === 'success') {
                itiContainer.classList.add('has-success');
            }
        }
    }
    
    /**
     * Clear phone input validation state
     */
    function clearPhoneValidationState() {
        const itiContainer = phoneInput.closest('.iti');
        if (itiContainer) {
            itiContainer.classList.remove('has-error', 'has-success');
        }
        
        // Clear message if it's phone-related
        if (!messageElement.classList.contains('hidden')) {
            const currentMessage = messageElement.textContent.toLowerCase();
            if (currentMessage.includes('phone') || currentMessage.includes('number')) {
                clearMessage();
            }
        }
    }
    
    /**
     * Validation helper functions
     */
    const validators = {
        isValidEmail: (email) => {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(email);
        },
        
        isValidPhone: () => {
            console.log('🔍 Phone validation called');
            console.log('🔍 iti object:', iti);
            console.log('🔍 phoneInput.value:', phoneInput.value);
            
            if (!iti) {
                console.log('🔍 No iti object, using fallback validation');
                // Fallback validation if intl-tel-input isn't available
                const phoneValue = phoneInput.value.trim();
                const isValid = phoneValue.length >= 7 && /^[\+]?[\d\s\-\(\)]+$/.test(phoneValue);
                console.log('🔍 Fallback validation result:', isValid);
                return isValid;
            }
            try {
                console.log('🔍 Using iti.isValidNumber()');
                const isValid = iti.isValidNumber();
                console.log('🔍 iti.isValidNumber() result:', isValid);
                
                // If validation fails, let's get more details
                if (!isValid) {
                    console.log('🔍 Phone number details:');
                    console.log('  - Raw value:', phoneInput.value);
                    console.log('  - Formatted number:', iti.getNumber());
                    console.log('  - Country code:', iti.getSelectedCountryData()?.iso2);
                    console.log('  - Country name:', iti.getSelectedCountryData()?.name);
                    console.log('  - National number:', iti.getNumber(intlTelInputUtils.numberType.NATIONAL));
                    console.log('  - International number:', iti.getNumber(intlTelInputUtils.numberType.INTERNATIONAL));
                    
                    // More lenient validation for Malaysian numbers
                    const phoneValue = phoneInput.value.trim();
                    const countryData = iti.getSelectedCountryData();
                    
                    // For Malaysia (MY), accept numbers with 8-11 digits
                    if (countryData?.iso2 === 'MY') {
                        const digitsOnly = phoneValue.replace(/\D/g, '');
                        const isValidMalaysian = digitsOnly.length >= 8 && digitsOnly.length <= 11;
                        console.log('🔍 Malaysian number validation:', {
                            digitsOnly,
                            length: digitsOnly.length,
                            isValidMalaysian
                        });
                        
                        if (isValidMalaysian) {
                            console.log('🔍 Accepting Malaysian number with lenient validation');
                            return true;
                        }
                    }
                }
                
                return isValid;
            } catch (error) {
                console.warn('Phone validation error:', error);
                // Fallback validation
                const phoneValue = phoneInput.value.trim();
                const isValid = phoneValue.length >= 7;
                console.log('🔍 Error fallback validation result:', isValid);
                return isValid;
            }
        },
        
        isValidPassword: (password) => {
            return password && password.length >= 8;
        },
        
        passwordsMatch: (password, confirmPassword) => {
            return password === confirmPassword;
        },
        
        isValidName: (name) => {
            return name && name.trim().length >= 2;
        }
    };
    
    /**
     * Get full international phone number
     */
    function getFullPhoneNumber() {
        if (!iti) {
            return phoneInput.value.trim();
        }
        try {
            return iti.getNumber() || phoneInput.value.trim();
        } catch (error) {
            console.warn('Error getting phone number:', error);
            return phoneInput.value.trim();
        }
    }
    
    /**
     * Validate all form fields with inline error messages
     */
    function validateForm() {
        const fullName = fullNameInput.value.trim();
        const displayName = displayNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Clear any existing messages and validation states
        clearMessage();
        clearPhoneValidationState();
        
        // Validation checks with inline messages
        if (!validators.isValidName(fullName)) {
            showMessage('Please enter a valid full name (at least 2 characters).', 'error');
            fullNameInput.focus();
            return false;
        }
        
        if (!validators.isValidName(displayName)) {
            showMessage('Please enter a valid display name (at least 2 characters).', 'error');
            displayNameInput.focus();
            return false;
        }
        
        if (!email) {
            showMessage('Please enter your email address.', 'error');
            emailInput.focus();
            return false;
        }
        
        if (!validators.isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            emailInput.focus();
            return false;
        }
        
        if (!phone) {
            showMessage('Please enter your phone number.', 'error');
            phoneInput.focus();
            setPhoneValidationState('error');
            return false;
        }
        
        if (!validators.isValidPhone()) {
            showMessage('Please enter a valid phone number for the selected country.', 'error');
            phoneInput.focus();
            setPhoneValidationState('error');
            return false;
        }
        
        if (!validators.isValidPassword(password)) {
            showMessage('Password must be at least 8 characters long.', 'error');
            passwordInput.focus();
            return false;
        }
        
        if (!confirmPassword) {
            showMessage('Please confirm your password.', 'error');
            confirmPasswordInput.focus();
            return false;
        }
        
        if (!validators.passwordsMatch(password, confirmPassword)) {
            showMessage('Passwords do not match. Please check and try again.', 'error');
            confirmPasswordInput.focus();
            return false;
        }
        
        // Set success state for phone if validation passes
        setPhoneValidationState('success');
        
        return true;
    }
    
    /**
     * Prepare form data for submission
     */
    function prepareFormData() {
        return {
            fullName: fullNameInput.value.trim(),
            displayName: displayNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: getFullPhoneNumber(),
            password: passwordInput.value
        };
    }
    
    /**
     * Submit form data to Supabase
     */
    async function submitForm(formData) {
        if (!supabase) {
            showMessage('Authentication service is not available. Please refresh the page.', 'error');
            return;
        }
        
        try {
            showMessage('Creating your account...', 'info');
            
            // 1. Sign up with Supabase Auth - this creates the user in auth.users
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        display_name: formData.displayName,
                        phone_number: formData.phone // Using phone_number consistently
                    }
                }
            });
            
            if (authError) {
                showMessage(authError.message || 'Registration failed. Please try again.', 'error');
                console.error('Supabase Auth error:', authError);
                return;
            }
            
            // 2. User created successfully in auth.users
            if (authData && authData.user) {
                // Log metadata for debugging
                console.log('User metadata sent:', {
                    full_name: formData.fullName,
                    display_name: formData.displayName,
                    phone_number: formData.phone
                });
                
                // Show success message without waiting for profile creation
                showMessage('Registration successful! Please check your email for confirmation. Redirecting to login...', 'success');
                
                // Let the auth webhook handle profile creation instead of doing it here
                // This prevents the infinite recursion in the database policy
                
                // Redirect to login page after success
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showMessage('Registration failed. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('An unexpected error occurred. Please try again later.', 'error');
        }
    }
    
    /**
     * Toggle password visibility with enhanced error handling
     */
    function initializePasswordToggle() {
        // Find all toggle buttons and add error checking
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        if (toggleButtons.length === 0) {
            console.warn('⚠️ No password toggle buttons found');
            return;
        }
        
        console.log(`🔧 Found ${toggleButtons.length} password toggle buttons`);
        
        toggleButtons.forEach((button, index) => {
            try {
                // Validate button structure
                if (!button || typeof button.addEventListener !== 'function') {
                    console.warn(`⚠️ Invalid toggle button at index ${index}`);
                    return;
                }
                
                const targetId = button.getAttribute('data-target');
                if (!targetId) {
                    console.warn(`⚠️ Toggle button missing data-target attribute at index ${index}`);
                    return;
                }
                
                const input = document.getElementById(targetId);
                if (!input) {
                    console.warn(`⚠️ Target input '${targetId}' not found for toggle button at index ${index}`);
                    return;
                }
                
                const icon = button.querySelector('.eye-icon');
                if (!icon) {
                    console.warn(`⚠️ Eye icon not found in toggle button for '${targetId}'`);
                    return;
                }
                
                // Add click event listener with error handling
                button.addEventListener('click', function(event) {
                    try {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        const currentType = input.getAttribute('type');
                        
                        if (currentType === 'password') {
                            // Show password
                            input.setAttribute('type', 'text');
                            icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12A18.5 18.5 0 0 1 19.74 16.19M14.12 14.12A3 3 0 1 1 9.88 9.88M14.12 14.12L9.88 9.88M14.12 14.12L18.36 18.36M9.88 9.88L5.64 5.64M9.88 9.88L14.12 14.12M18.36 18.36L21.07 21.07M5.64 5.64L2.93 2.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
                            this.setAttribute('title', 'Hide password');
                            console.log(`👁️ Password revealed for ${targetId}`);
                        } else {
                            // Hide password
                            input.setAttribute('type', 'password');
                            icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>';
                            this.setAttribute('title', 'Show password');
                            console.log(`🙈 Password hidden for ${targetId}`);
                        }
                    } catch (toggleError) {
                        console.error(`❌ Error toggling password visibility for ${targetId}:`, toggleError);
                    }
                });
                
                console.log(`✅ Password toggle initialized for ${targetId}`);
                
            } catch (error) {
                console.error(`❌ Error initializing password toggle at index ${index}:`, error);
            }
        });
    }
    
    /**
     * Handle social logins
     */
    function initializeSocialLogins() {
        const appleLoginBtn = document.querySelector('button:has(svg path[d^="M17.05"])');
        const googleLoginBtn = document.querySelector('button:has(svg path[d^="M21.8055"])');
        
        if (appleLoginBtn) {
            appleLoginBtn.addEventListener('click', async function() {
                if (!supabase) {
                    showMessage('Authentication service is not available. Please refresh the page.', 'error');
                    return;
                }
                
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'apple'
                    });
                    
                    if (error) {
                        showMessage('Apple login failed. Please try again.', 'error');
                        console.error('Apple login error:', error);
                    }
                } catch (error) {
                    console.error('Apple login error:', error);
                    showMessage('An unexpected error occurred. Please try again later.', 'error');
                }
            });
        }
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', async function() {
                if (!supabase) {
                    showMessage('Authentication service is not available. Please refresh the page.', 'error');
                    return;
                }
                
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'google'
                    });
                    
                    if (error) {
                        showMessage('Google login failed. Please try again.', 'error');
                        console.error('Google login error:', error);
                    }
                } catch (error) {
                    console.error('Google login error:', error);
                    showMessage('An unexpected error occurred. Please try again later.', 'error');
                }
            });
        }
    }
    
    /**
     * Handle form submission with inline messages
     */
    async function handleFormSubmission(event) {
        console.log('🚀 Form submission started');
        event.preventDefault(); // Prevent page reload
        
        console.log('📝 Validating form...');
        // Validate form
        if (!validateForm()) {
            console.log('❌ Form validation failed');
            return;
        }
        
        console.log('✅ Form validation passed');
        // Prepare and submit data
        const formData = prepareFormData();
        console.log('📦 Form data prepared:', formData);
        
        // Disable form during submission
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span> Creating Account...';
        
        try {
            console.log('🔄 Submitting form to Supabase...');
            await submitForm(formData);
        } catch (error) {
            console.error('❌ Form submission error:', error);
            showMessage('An unexpected error occurred. Please try again.', 'error');
        } finally {
            // Re-enable form
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
    
    /**
     * Add input event listeners to clear messages when user starts typing
     */
    function initializeInputListeners() {
        const inputs = [fullNameInput, displayNameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput];
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                // Clear message when user starts typing
                if (!messageElement.classList.contains('hidden')) {
                    clearMessage();
                }
            });
            
            input.addEventListener('focus', function() {
                // Clear message when user focuses on any input
                if (!messageElement.classList.contains('hidden')) {
                    clearMessage();
                }
            });
        });
            }

    /**
     * Initialize the application
     */
    async function initialize() {
        try {
            console.log('🔧 Starting signup form initialization...');
            
            // Wait for intl-tel-input to be fully loaded
            let retries = 0;
            while (typeof window.intlTelInput !== 'function' && retries < 10) {
                console.log('⏳ Waiting for intl-tel-input to load...', retries + 1);
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }
            
            if (typeof window.intlTelInput !== 'function') {
                console.warn('⚠️ intl-tel-input did not load properly, using fallback');
            }
            
            // Initialize phone input
            await initializePhoneInput();
            
            // Initialize password toggle
            initializePasswordToggle();
            
            // Initialize social logins
            initializeSocialLogins();
            
            // Initialize input listeners
            initializeInputListeners();
            
            // Add form submission handler
            if (signupForm) {
                console.log('📝 Adding form submission handler to signupForm');
                signupForm.addEventListener('submit', handleFormSubmission);
                console.log('✅ Form submission handler added successfully');
            } else {
                console.error('❌ signupForm element not found!');
            }
            
            console.log('✅ Signup form initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize signup form:', error);
            showMessage('There was an error loading the registration form. Please refresh the page and try again.', 'error');
            }
    }
    
    // Initialize the application
    initialize();
}); 