/**
 * Overlay Search Implementation
 */

function initOverlaySearch() {
    const searchInput = $('#overlay-search');
    const resultsContainer = $('#overlay-search-dropdown');

    if (!searchInput.length) return;

    let searchTimeout;

    searchInput.on('input', function() {
        const query = $(this).val().trim();

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (!query) {
            resultsContainer.empty().hide();
            return;
        }

        searchTimeout = setTimeout(() => {
            performOverlaySearch(query);
        }, 300);
    });

    function performOverlaySearch(query) {
        resultsContainer.empty();

        if (!window.config || !window.config.layers) {
            return;
        }

        const results = [];
        const queryLower = query.toLowerCase();

        window.config.layers.forEach(layerGroup => {
            if (layerGroup.get && layerGroup.get('type') === 'overlay') {
                layerGroup.getLayers().forEach((overlay, index) => {
                    const title = overlay.get('title') || '';
                    if (title.toLowerCase().includes(queryLower)) {
                        results.push({
                            title: title,
                            overlay: overlay,
                            layerGroup: layerGroup
                        });
                    }
                });
            }
        });

        displayOverlayResults(results);
    }

    function displayOverlayResults(results) {
        if (results.length === 0) {
            resultsContainer.append('<div class="no-results">No overlays found</div>');
            resultsContainer.show();
            return;
        }

        results.forEach(result => {
            const resultElement = $('<div>')
                .addClass('overlay-search-result')
                .text(result.title)
                .on('click', function() {
                    // Toggle overlay visibility
                    const visible = result.overlay.getVisible();
                    result.overlay.setVisible(!visible);
                    resultsContainer.empty().hide();

                    // Update overlay summary
                    if (window.updateOverlaySummary) {
                        window.updateOverlaySummary();
                    }
                });

            resultsContainer.append(resultElement);
        });

        resultsContainer.show();
    }

    $(document).on('click', function(e) {
        if (!$(e.target).closest('#overlay-search-container').length) {
            resultsContainer.empty().hide();
        }
    });
}

$(document).ready(function() {
    initOverlaySearch();
});

window.initOverlaySearch = initOverlaySearch;
