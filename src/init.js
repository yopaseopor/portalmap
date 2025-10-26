import { setLanguage, getCurrentLanguage } from './i18n/index.js';
import config from './config.js';
import { overlayConfig } from './config_overlay.js';
import './overlay_integration.js';

// Initialize configuration
window.config = config;

// Initialize overlays
window.config.overlays = overlayConfig.overlays;

// Function to parse and load shared URLs
function loadSharedUrl() {
    console.log('🔗 Loading shared URL parameters');

    const urlParams = new URLSearchParams(window.location.search);

    // Parse tag queries from URL (format: tag=key:value)
    const tagQueries = [];
    urlParams.forEach((value, key) => {
        if (key === 'tag' && value.includes(':')) {
            const [tagKey, tagValue] = value.split(':');
            tagQueries.push({ key: tagKey, value: tagValue });
        }
    });

    if (tagQueries.length > 0) {
        console.log('🔗 Found tag queries in URL:', tagQueries);

        // Wait for map and value search to be ready
        const waitForDependencies = () => {
            console.log('🔗 Checking dependencies...');
            console.log('🔗 Map exists:', !!window.map);
            console.log('🔗 executeTagQuery exists:', !!window.executeTagQuery);
            console.log('🔗 tagQueryLegend exists:', !!window.tagQueryLegend);

            if (window.map && window.executeTagQuery && window.tagQueryLegend) {
                console.log('🔗 Dependencies ready, executing tag queries');

                // Execute each tag query
                tagQueries.forEach((query, index) => {
                    setTimeout(() => {
                        console.log('🔗 Executing tag query:', query.key, query.value);
                        window.executeTagQuery(query.key, query.value);
                    }, index * 1500); // 1.5 second delay between queries to avoid overwhelming the system
                });

                // Update URL after loading queries
                setTimeout(() => {
                    if (window.updatePermalink) {
                        window.updatePermalink();
                    }
                }, 3000);
            } else {
                console.log('🔗 Dependencies not ready, waiting...');
                setTimeout(waitForDependencies, 500);
            }
        };

        // Start checking immediately
        waitForDependencies();
    } else {
        // If no tag queries in URL, still update permalink after a delay to ensure current state is reflected
        setTimeout(() => {
            if (window.updatePermalink) {
                window.updatePermalink();
            }
        }, 2000);
    }

    // Set map view if coordinates are provided
    const lat = urlParams.get('lat');
    const lon = urlParams.get('lon');
    const zoom = urlParams.get('zoom');

    if (lat && lon && zoom && window.map) {
        console.log('🔗 Setting map view from URL:', lat, lon, zoom);
        const view = window.map.getView();
        const center = ol.proj.fromLonLat([parseFloat(lon), parseFloat(lat)]);
        view.setCenter(center);
        view.setZoom(parseInt(zoom));
    }
}

// Load shared URL after config is initialized
setTimeout(loadSharedUrl, 100);

// Dispatch config loaded event after everything is initialized
window.dispatchEvent(new CustomEvent('configLoaded', {
    detail: window.config
}));

// Notify overlay searcher that overlays are ready
window.dispatchEvent(new CustomEvent('overlaySearchUpdate', {
    detail: {
        overlays: window.config.overlays
    }
}));

// Initialize map when document is ready
$(document).ready(function() {
    // Map initialization will be handled by index.js
}); 