document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.toggle-password');
    
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
    }
    
    // Email validation function
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // Show validation message
    function showValidationMessage(input, show, message = null) {
        const validationMessage = input.closest('div').parentElement.querySelector('.validation-message');
        if (show) {
            validationMessage.classList.remove('hidden');
            if (message) {
                validationMessage.textContent = message;
                // Ensure consistent styling for dynamic messages
                validationMessage.className = 'validation-message text-red-500 text-xs mt-1';
            }
            input.classList.add('border-red-500');
            input.classList.remove('border-gray-300');
        } else {
            validationMessage.classList.add('hidden');
            input.classList.remove('border-red-500');
            input.classList.add('border-gray-300');
        }
    }

    // Handle input validation on blur
    emailInput.addEventListener('blur', function() {
        if (!this.value) {
            showValidationMessage(this, true, 'Email is required');
        } else if (!isValidEmail(this.value)) {
            showValidationMessage(this, true, 'Please enter a valid email address');
        } else {
            showValidationMessage(this, false);
        }
    });

    passwordInput.addEventListener('blur', function() {
        if (!this.value) {
            showValidationMessage(this, true, 'Password is required');
        } else {
            showValidationMessage(this, false);
        }
    });

    // Clear validation messages on input
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', function() {
            showValidationMessage(this, false);
        });
    });

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Update the icon based on password visibility
            const icon = this.querySelector('svg');
            if (type === 'password') {
                icon.innerHTML = `<path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>`;
            } else {
                icon.innerHTML = `<path d="M12 6.5c3.79 0 7.17 2.13 8.82 5.5-1.65 3.37-5.02 5.5-8.82 5.5S4.83 15.37 3.18 12C4.83 8.63 8.21 6.5 12 6.5m0-2C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5m0-2c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z" fill="currentColor"/><path d="M2.81 2.81L1.39 4.22l2.27 2.27C2.61 8.07 1.61 9.88 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l2.81 2.81 1.41-1.41L2.81 2.81zM12 17c-3.79 0-7.17-2.13-8.82-5.5.7-1.43 1.72-2.61 2.93-3.52l2.6 2.6C8.28 11.38 8 12.15 8 13c0 2.21 1.79 4 4 4 .85 0 1.62-.28 2.42-.71l2.6 2.6C15.03 19.7 13.55 20 12 20z" fill="currentColor"/>`;
            }
        });
    }

    // Show message function for login feedback
    function showMessage(message, type = 'error') {
        // Remove any existing messages
        const existingMessage = document.querySelector('.login-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'login-message';
        
        if (type === 'success') {
            messageDiv.className += ' text-green-600 bg-green-50 border border-green-200';
        } else {
            messageDiv.className += ' text-red-600 bg-red-50 border border-red-200';
        }
        
        messageDiv.className += ' p-3 rounded-lg text-sm mb-4';
        messageDiv.textContent = message;
        
        // Insert before the form
        loginForm.parentNode.insertBefore(messageDiv, loginForm);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
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
                    
                    // If the profile doesn't exist yet, try to create it
                    if (typeof createProfileIfNeeded === 'function') {
                        console.log('Attempting to create profile during redirect...');
                        createProfileIfNeeded(supabase, user)
                            .then(({ data: profileData, error: profileError }) => {
                                if (profileError) {
                                    console.error('Failed to create profile during redirect:', profileError);
                                    // Default to regular dashboard
                                    window.location.href = 'dashboard.html';
                                } else if (profileData) {
                                    console.log('Profile created during redirect, refreshing...');
                                    // Refresh the page to try again with the new profile
                                    window.location.reload();
                                }
                            });
                    } else {
                        // Default to regular dashboard if profile fetch fails
                    window.location.href = 'dashboard.html';
                    }
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
                const redirectPage = isAdmin ? 'dashboard-admin.html' : 'dashboard.html';
                
                // If we're not already on the dashboard page, redirect
                if (!window.location.href.includes(redirectPage)) {
                    window.location.href = redirectPage;
    }
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
                // Default to regular dashboard if profile fetch fails
                window.location.href = 'dashboard.html';
            });
    }

    // Login with Supabase
    async function handleLogin(email, password) {
        if (!supabase) {
            showMessage('Authentication service is not available. Please refresh the page.');
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span> Signing in...';
            submitBtn.disabled = true;
            
            // Attempt login with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            // Reset button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            
            if (error) {
                showMessage(error.message || 'Login failed. Please check your credentials and try again.');
                console.error('Login error:', error);
                return;
            }
            
            // Login successful
            showMessage('Login successful! Redirecting...', 'success');
                
            // Redirect to appropriate dashboard
            redirectToDashboard(data.user);
            
        } catch (error) {
            console.error('Login error:', error);
            showMessage('An unexpected error occurred. Please try again later.');
        }
    }

    // Handle social logins
    const appleLoginBtn = document.querySelector('button:has(svg path[d^="M17.05"])');
    const googleLoginBtn = document.querySelector('button:has(svg path[d^="M21.8055"])');
    
    if (appleLoginBtn) {
        appleLoginBtn.addEventListener('click', async function() {
            if (!supabase) {
                showMessage('Authentication service is not available. Please refresh the page.');
                return;
            }
            
            try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'apple'
                });
                
                if (error) {
                    showMessage('Apple login failed. Please try again.');
                    console.error('Apple login error:', error);
                }
            } catch (error) {
                console.error('Apple login error:', error);
                showMessage('An unexpected error occurred. Please try again later.');
            }
        });
    }
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            if (!supabase) {
                showMessage('Authentication service is not available. Please refresh the page.');
                return;
            }
            
            try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google'
                });
                
                if (error) {
                    showMessage('Google login failed. Please try again.');
                    console.error('Google login error:', error);
                }
            } catch (error) {
                console.error('Google login error:', error);
                showMessage('An unexpected error occurred. Please try again later.');
        }
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;

            // Validate email
            if (!emailInput.value) {
                showValidationMessage(emailInput, true, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showValidationMessage(emailInput, true, 'Please enter a valid email address');
                isValid = false;
            }

            // Validate password
            if (!passwordInput.value) {
                showValidationMessage(passwordInput, true, 'Password is required');
                isValid = false;
            }

            if (isValid) {
                // Handle login
                handleLogin(emailInput.value, passwordInput.value);
            }
        });
    }
}); 