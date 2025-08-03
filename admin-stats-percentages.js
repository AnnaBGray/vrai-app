/**
 * Admin Stats Percentages
 * Calculates and displays percentage changes for dashboard statistics
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin page
    if (!document.querySelector('[data-stat="total-submissions"]')) {
        console.log('[STATS] Not on admin page, skipping percentage calculations');
        return;
    }

    // Wait for Supabase client to be available
    const waitForSupabase = () => {
        if (window.supabaseClient) {
            console.log('[STATS] Supabase client available, loading stats percentages');
            loadStatsPercentages();
        } else {
            console.log('[STATS] Waiting for Supabase client...');
            setTimeout(waitForSupabase, 500);
        }
    };
    
    waitForSupabase();
});

/**
 * Load statistics percentages from daily_dashboard_stats table
 */
async function loadStatsPercentages() {
    try {
        const supabase = window.supabaseClient;
        
        if (!supabase) {
            console.error('[STATS] Supabase client not available');
            return;
        }
        
        // Get today's date (YYYY-MM-DD format)
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Get yesterday's date (YYYY-MM-DD format)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        console.log(`[STATS] Fetching stats for dates: ${yesterdayStr} and ${todayStr}`);
        
        // Fetch the last two days of stats
        const { data, error } = await supabase
            .from('daily_dashboard_stats')
            .select('*')
            .in('date', [todayStr, yesterdayStr])
            .order('date', { ascending: false });
        
        if (error) {
            console.error('[STATS] Error fetching stats:', error);
            return;
        }
        
        console.log('[STATS] Fetched data:', data);
        
        if (!data || data.length === 0) {
            console.warn('[STATS] No stats data available');
            return;
        }
        
        // Extract today's and yesterday's stats
        const todayStats = data.find(item => item.date === todayStr) || {};
        const yesterdayStats = data.find(item => item.date === yesterdayStr) || {};
        
        console.log('[STATS] Today stats:', todayStats);
        console.log('[STATS] Yesterday stats:', yesterdayStats);
        
        // Calculate and update percentages
        updatePercentages(todayStats, yesterdayStats);
        
    } catch (error) {
        console.error('[STATS] Error loading stats percentages:', error);
    }
}

/**
 * Calculate and update percentage changes for all stats
 * @param {Object} todayStats - Today's statistics
 * @param {Object} yesterdayStats - Yesterday's statistics
 */
function updatePercentages(todayStats, yesterdayStats) {
    // Define the stats to update
    const statsToUpdate = [
        { key: 'total_submissions', selector: '[data-stat="total-submissions"]' },
        { key: 'pending_review', selector: '[data-stat="pending-review"]' },
        { key: 'processed_today', selector: '[data-stat="approved-today"]' },
        { key: 'active_users', selector: '[data-stat="active-users"]' }
    ];
    
    // Update each stat
    statsToUpdate.forEach(stat => {
        const today = todayStats[stat.key] || 0;
        const yesterday = yesterdayStats[stat.key] || 0;
        
        // Find the percentage display element (next sibling of the stat value)
        const statElement = document.querySelector(stat.selector);
        if (!statElement) return;
        
        const percentageElement = statElement.parentElement.querySelector('.flex.items-center span');
        if (!percentageElement) return;
        
        // Calculate percentage change
        const percentChange = calculatePercentageChange(today, yesterday);
        
        // Update the percentage element
        updatePercentageElement(percentageElement, percentChange);
    });
}

/**
 * Calculate percentage change between two values
 * @param {number} today - Today's value
 * @param {number} yesterday - Yesterday's value
 * @returns {number} - Percentage change
 */
function calculatePercentageChange(today, yesterday) {
    // Case 1: If yesterday = 0 and today = 0, return 0
    if (yesterday === 0 && today === 0) {
        return 0;
    }
    
    // Case 2: If yesterday = 0 and today > 0, return today * 100%
    if (yesterday === 0 && today > 0) {
        return today * 100;
    }
    
    // Case 3: Standard percentage change formula
    return ((today - yesterday) / yesterday) * 100;
}

/**
 * Update percentage element with formatted value and correct styling
 * @param {HTMLElement} element - Percentage display element
 * @param {number} percentage - Percentage change value
 */
function updatePercentageElement(element, percentage) {
    // Round to 1 decimal place
    const roundedPercentage = Math.round(percentage * 10) / 10;
    
    // Format the percentage string
    let formattedPercentage;
    if (roundedPercentage > 0) {
        formattedPercentage = `+${roundedPercentage.toFixed(1)}%`;
        element.classList.remove('text-red-600', 'text-gray-600');
        element.classList.add('text-green-600');
    } else if (roundedPercentage < 0) {
        formattedPercentage = `${roundedPercentage.toFixed(1)}%`; // Negative sign is already included
        element.classList.remove('text-green-600', 'text-gray-600');
        element.classList.add('text-red-600');
    } else {
        formattedPercentage = '0.0%';
        element.classList.remove('text-green-600', 'text-red-600');
        element.classList.add('text-gray-600');
    }
    
    // Update the element content, preserving the SVG icon
    const svgIcon = element.querySelector('svg');
    const svgHtml = svgIcon ? svgIcon.outerHTML : '';
    element.innerHTML = `${svgHtml} ${formattedPercentage}`;
} 