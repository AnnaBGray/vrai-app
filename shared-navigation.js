/**
 * Shared Bottom Navigation Manager
 * This file provides a centralized way to render and manage the bottom navigation
 * across all pages in the application.
 */

class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.isAdmin = this.checkAdminStatus();
    }

    /**
     * Get the current page from the URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '');
    }

    /**
     * Check if the current user is an admin
     */
    checkAdminStatus() {
        return sessionStorage.getItem('isAdmin') === 'true';
    }

    /**
     * Get the appropriate dashboard URL based on admin status
     */
    getDashboardUrl() {
        return this.isAdmin ? 'dashboard-admin.html' : 'index.html';
    }

    /**
     * Generate the complete bottom navigation HTML
     */
    generateNavigationHTML() {
        const dashboardUrl = this.getDashboardUrl();
        const adminItem = this.isAdmin ? this.getAdminNavigationItem() : '';

        return `
            <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 py-3 px-4 shadow-sm z-50">
                <div class="flex justify-around items-center">
                    <!-- Dashboard -->
                    <a href="${dashboardUrl}" class="flex flex-col items-center justify-center text-xs font-medium ${this.getItemClass('dashboard')}">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
                        </svg>
                        <span class="mt-1">Dashboard</span>
                    </a>
                    <!-- Authenticate -->
                    <a href="authenticate-guide.html" class="flex flex-col items-center justify-center text-xs font-medium ${this.getItemClass('authenticate')}">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2ZM12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17ZM12 4.5C12.8284 4.5 13.5 3.82843 13.5 3C13.5 2.17157 12.8284 1.5 12 1.5C11.1716 1.5 10.5 2.17157 10.5 3C10.5 3.82843 11.1716 4.5 12 4.5ZM19 4.5C19.8284 4.5 20.5 3.82843 20.5 3C20.5 2.17157 19.8284 1.5 19 1.5C18.1716 1.5 17.5 2.17157 17.5 3C17.5 3.82843 18.1716 4.5 19 4.5ZM21 19H3C2.45 19 2 18.55 2 18V6C2 5.45 2.45 5 3 5H7L9 3H15L17 5H21C21.55 5 22 5.45 22 6V18C22 18.55 21.55 19 21 19ZM20 17H4V7H20V17Z" fill="currentColor"/>
                        </svg>
                        <span class="mt-1">Authenticate</span>
                    </a>
                    <!-- Settings -->
                    <a href="settings.html" class="flex flex-col items-center justify-center text-xs font-medium ${this.getItemClass('settings')}">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
                            <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
                        </svg>
                        <span class="mt-1">Settings</span>
                    </a>
                    ${adminItem}
                </div>
            </nav>
        `;
    }

    /**
     * Generate the Admin navigation item HTML
     */
    getAdminNavigationItem() {
        return `
            <!-- Admin -->
            <a href="admin.html" class="flex flex-col items-center justify-center text-xs font-medium ${this.getItemClass('admin')}">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4L13.5 7H7V9H13.5L15 12L21 9ZM16 12C17.1 12 18 12.9 18 14S17.1 16 16 16 14 15.1 14 14 14.9 12 16 12ZM8 12C9.1 12 10 12.9 10 14S9.1 16 8 16 6 15.1 6 14 6.9 12 8 12ZM12 14C13.1 14 14 14.9 14 16S13.1 18 12 18 10 17.1 10 16 10.9 14 12 14ZM12 20C16.4 20 20 16.4 20 12S16.4 4 12 4 4 7.6 4 12 7.6 20 12 20Z" fill="currentColor"/>
                </svg>
                <span class="mt-1">Admin</span>
            </a>
        `;
    }

    /**
     * Get the CSS class for a navigation item based on current page
     */
    getItemClass(item) {
        // Define page mappings
        const pageMap = {
            'dashboard': ['dashboard', 'dashboard-admin'],
            'authenticate': ['authenticate-guide', 'authenticate-step1', 'authenticate-step2', 'authenticate-step3', 'authenticate-step4', 'authenticate-step5', 'authenticate-step6', 'authenticate-step7', 'authenticate-step8', 'authenticate-step9', 'authenticate-step10', 'authenticate-confirmation'],
            'settings': ['settings', 'profile-settings', 'change-password'],
            'admin': ['admin', 'admin-submissions', 'admin-submission-detail']
        };

        // Check if current page matches this item
        if (pageMap[item] && pageMap[item].includes(this.currentPage)) {
            return 'text-[#89CFF0]'; // Active color
        }
        
        return 'text-gray-400'; // Inactive color
    }

    /**
     * Render the navigation and insert it into the page
     */
    render(containerId = 'bottom-navigation-container') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.generateNavigationHTML();
        } else {
            // If no container is specified, append to body
            const navigationHTML = this.generateNavigationHTML();
            document.body.insertAdjacentHTML('beforeend', navigationHTML);
        }
    }

    /**
     * Initialize the navigation manager
     */
    static init() {
        const nav = new NavigationManager();
        nav.render();
        return nav;
    }
}

// Auto-initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if there's no existing navigation
    if (!document.querySelector('nav[class*="bottom-0"]')) {
        NavigationManager.init();
    }
});

// Export for manual use
window.NavigationManager = NavigationManager; 