/**
 * Layer Search Implementation
 */

function initLayerSearch() {
    const searchInput = $('#layer-search');
    const resultsContainer = $('#layer-search-dropdown');

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
            performLayerSearch(query);
        }, 300);
    });

    function performLayerSearch(query) {
        resultsContainer.empty();

        if (!window.config || !window.config.layers) {
            return;
        }

        const results = [];
        const queryLower = query.toLowerCase();

        window.config.layers.forEach((layer, index) => {
            const title = layer.get('title') || '';
            if (title.toLowerCase().includes(queryLower)) {
                results.push({
                    title: title,
                    index: index,
                    layer: layer
                });
            }
        });

        displayLayerResults(results);
    }

    function displayLayerResults(results) {
        if (results.length === 0) {
            resultsContainer.append('<div class="no-results">No layers found</div>');
            resultsContainer.show();
            return;
        }

        results.forEach(result => {
            const resultElement = $('<div>')
                .addClass('layer-search-result')
                .text(result.title)
                .on('click', function() {
                    // Toggle layer visibility
                    const visible = result.layer.getVisible();
                    result.layer.setVisible(!visible);
                    resultsContainer.empty().hide();
                });

            resultsContainer.append(resultElement);
        });

        resultsContainer.show();
    }

    $(document).on('click', function(e) {
        if (!$(e.target).closest('#layer-search-container').length) {
            resultsContainer.empty().hide();
        }
    });
}

$(document).ready(function() {
    initLayerSearch();
});

window.initLayerSearch = initLayerSearch;
