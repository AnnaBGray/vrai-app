/**
 * Shared Tailwind CSS Configuration for Vrai Project
 * Include this file in HTML pages to ensure consistent styling
 */

// Centralized Tailwind configuration
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    // Primary color palette using proper Tailwind scale
                    primary: {
                        50: '#f0fdf9',
                        100: '#d4f7ed', 
                        200: '#ade8d8',
                        300: '#7dd3c0',
                        400: '#4aadc1', // Lighter variant
                        500: '#89CFF0', // Main primary color (existing)
                        600: '#7ab8d9', // Darker variant (existing primary-dark)
                        700: '#5a9bc7',
                        800: '#4682b4',
                        900: '#2e5a87',
                        950: '#1e3a5f'
                    },
                    // Additional semantic colors
                    success: {
                        50: '#f0fdf4',
                        500: '#22c55e',
                        600: '#16a34a'
                    },
                    error: {
                        50: '#fef2f2',
                        500: '#ef4444',
                        600: '#dc2626'
                    },
                    warning: {
                        50: '#fffbeb',
                        500: '#f59e0b',
                        600: '#d97706'
                    }
                },
                fontFamily: {
                    'sans': ['Inter', 'system-ui', 'sans-serif'],
                    'display': ['Playfair Display', 'Georgia', 'serif'],
                },
                boxShadow: {
                    'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
                    'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
                    'float': '0 10px 25px rgba(0, 0, 0, 0.1)'
                },
                animation: {
                    'fade-in': 'fadeIn 0.2s ease-in-out',
                    'slide-up': 'slideUp 0.3s ease-out'
                },
                keyframes: {
                    fadeIn: {
                        '0%': { opacity: '0' },
                        '100%': { opacity: '1' }
                    },
                    slideUp: {
                        '0%': { transform: 'translateY(10px)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' }
                    }
                }
            },
        }
    };
} 