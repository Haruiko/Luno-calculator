// Enhanced Channels Functionality - Active/Inactive Behavior
document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'channelActiveState';
    const TOTAL_CHANNELS = 450;
    
    // Elements
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const clearActiveBtn = document.getElementById('clearActiveBtn');
    const channelsGrid = document.getElementById('channelsGrid');
    const activeChannelsGrid = document.getElementById('activeChannelsGrid');
    const activeSection = document.getElementById('activeSection');
    const noActive = document.getElementById('noActive');
    const noResults = document.getElementById('noResults');
    const totalChannels = document.getElementById('totalChannels');
    const visibleChannels = document.getElementById('visibleChannels');
    const activeCount = document.getElementById('activeCount');
    
    let activeChannelSet = new Set();
    let allChannels = [];
    
    // Load saved state
    function loadActiveChannels() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                activeChannelSet = new Set(data);
            } catch (e) {
                console.warn('Failed to load active channels:', e);
            }
        }
    }
    
    // Save state
    function saveActiveChannels() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...activeChannelSet]));
    }
    
    // Create channel element
    function createChannelElement(number, isActive = false, forActiveSection = false) {
        const channel = document.createElement('div');
        channel.className = `channel ${isActive ? 'active' : ''}`;
        channel.textContent = number;
        channel.dataset.channel = number;
        
        channel.addEventListener('click', () => toggleChannel(number));
        
        return channel;
    }
    
    // Toggle channel active state
    function toggleChannel(number) {
        if (activeChannelSet.has(number)) {
            // Deactivating channel
            activeChannelSet.delete(number);
        } else {
            // Activating channel
            activeChannelSet.add(number);
        }
        
        saveActiveChannels();
        updateChannelDisplay();
        updateStats();
    }
    
    // Generate all channels
    function generateChannels() {
        allChannels = [];
        for (let i = 1; i <= TOTAL_CHANNELS; i++) {
            allChannels.push(i);
        }
    }
    
    // Update channel display with enhanced behavior
    function updateChannelDisplay() {
        const searchQuery = searchInput.value.trim().toLowerCase();
        
        // Filter channels based on search, but exclude active channels from main grid
        const allFilteredChannels = filterChannels(searchQuery);
        const nonActiveChannels = allFilteredChannels.filter(num => !activeChannelSet.has(num));
        
        // Clear grids
        channelsGrid.innerHTML = '';
        activeChannelsGrid.innerHTML = '';
        
        // Show/hide no results for main channels
        if (nonActiveChannels.length === 0 && searchQuery) {
            // Check if there are any matching channels at all
            const hasMatchingChannels = allFilteredChannels.length > 0;
            if (hasMatchingChannels) {
                // All matching channels are active
                noResults.innerHTML = 'All matching channels are currently active.';
            } else {
                // No channels match the search
                noResults.innerHTML = 'No channels found matching your search.';
            }
            noResults.style.display = 'block';
            channelsGrid.style.display = 'none';
        } else if (nonActiveChannels.length === 0 && !searchQuery) {
            // All channels are active
            noResults.innerHTML = 'All channels are currently active.';
            noResults.style.display = 'block';
            channelsGrid.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            channelsGrid.style.display = 'grid';
        }
        
        // Render non-active channels in main grid
        nonActiveChannels.forEach(num => {
            const channel = createChannelElement(num, false);
            channelsGrid.appendChild(channel);
        });
        
        // Render active channels in separate section
        const activeChannels = [...activeChannelSet].sort((a, b) => a - b);
        activeChannels.forEach(num => {
            const channel = createChannelElement(num, true, true);
            activeChannelsGrid.appendChild(channel);
        });
        
        // Show/hide active section
        if (activeChannels.length === 0) {
            noActive.style.display = 'block';
            activeChannelsGrid.style.display = 'none';
        } else {
            noActive.style.display = 'none';
            activeChannelsGrid.style.display = 'grid';
        }
        
        updateStats(nonActiveChannels.length);
    }
    
    // Filter channels based on search
    function filterChannels(query) {
        if (!query) return allChannels;
        
        // Handle range queries (e.g., "50-60", "100-150")
        const rangeMatch = query.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);
            return allChannels.filter(num => num >= start && num <= end);
        }
        
        // Handle comma-separated queries (e.g., "1,5,10")
        if (query.includes(',')) {
            const numbers = query.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            return allChannels.filter(num => numbers.includes(num));
        }
        
        // Handle single number or partial match
        const searchNum = parseInt(query);
        if (!isNaN(searchNum)) {
            // Exact match first, then partial matches
            const exact = allChannels.filter(num => num === searchNum);
            const partial = allChannels.filter(num => 
                num !== searchNum && num.toString().includes(query)
            );
            return [...exact, ...partial];
        }
        
        return allChannels.filter(num => num.toString().includes(query));
    }
    
    // Update statistics - now reflects only non-active channels in visible count
    function updateStats(visibleNonActive = 0) {
        if (totalChannels) totalChannels.textContent = TOTAL_CHANNELS;
        if (visibleChannels) visibleChannels.textContent = visibleNonActive;
        if (activeCount) activeCount.textContent = activeChannelSet.size;
    }
    
    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', updateChannelDisplay);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateChannelDisplay();
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            updateChannelDisplay();
            searchInput.focus();
        });
    }
    
    if (clearActiveBtn) {
        clearActiveBtn.addEventListener('click', () => {
            if (activeChannelSet.size > 0) {
                if (confirm(`Clear all ${activeChannelSet.size} active channels?`)) {
                    activeChannelSet.clear();
                    saveActiveChannels();
                    updateChannelDisplay();
                }
            }
        });
    }
    
    // Initialize
    loadActiveChannels();
    generateChannels();
    updateChannelDisplay();
});