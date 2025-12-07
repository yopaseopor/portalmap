/**
 * Nominatim Search Implementation
 */
function initNominatimSearch(map) {
    // Search Control
    var searchControlBuild = function () {
        var container = $('<div>').addClass('ol-control ol-unselectable nominatim-search')
            .html($('<button type="button"><i class="fa fa-search"></i></button>'));
        
        var searchInput = $('<input type="text" placeholder="Search...">').hide();
        var resultsList = $('<ul>').addClass('search-results').hide();
        container.append(searchInput).append(resultsList);

        container.on('click', 'button', function(e) {
            e.preventDefault();
            searchInput.toggle();
            if (searchInput.is(':visible')) {
                searchInput.focus();
            } else {
                resultsList.hide();
            }
        });

        searchInput.on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                var query = $(this).val();
                if (query) {
                    // Show loading state
                    container.addClass('loading');
                    
                    // Make the Nominatim API call
                    $.ajax({
                        url: 'https://nominatim.openstreetmap.org/search',
                        data: {
                            q: query,
                            format: 'json',
                            limit: 10,
                            addressdetails: 1
                        },
                        success: function(data) {
                            resultsList.empty();
                            if (data && data.length > 0) {
                                data.forEach(function(result) {
                                    var displayName = result.display_name.split(',')[0] + 
                                                    (result.address ? ', ' + (result.address.city || result.address.town || result.address.village || '') : '');
                                    
                                    $('<li>')
                                        .text(displayName)
                                        .data('result', result)
                                        .appendTo(resultsList);
                                });
                                resultsList.show();
                            } else {
                                resultsList.append($('<li>').addClass('no-results').text('No results found'));
                                resultsList.show();
                            }
                            container.removeClass('loading');
                        },
                        error: function() {
                            container.removeClass('loading');
                            resultsList.empty()
                                .append($('<li>').addClass('no-results').text('Search error'))
                                .show();
                            console.error('Geocoding error');
                        }
                    });
                }
            }
        });

        resultsList.on('click', 'li', function() {
            if (!$(this).hasClass('no-results')) {
                var result = $(this).data('result');
                var coordinates = ol.proj.fromLonLat([
                    parseFloat(result.lon),
                    parseFloat(result.lat)
                ]);

                // Animate to location
                map.getView().animate({
                    center: coordinates,
                    zoom: 17,
                    duration: 1000
                });

                // Add temporary marker
                var markerElement = $('<div>')
                    .addClass('nominatim-marker')
                    .html('<i class="fa fa-map-marker"></i>')[0];

                var marker = new ol.Overlay({
                    position: coordinates,
                    positioning: 'bottom-center',
                    element: markerElement,
                    offset: [0, -20]
                });
                map.addOverlay(marker);

                // Remove marker after 5 seconds
                setTimeout(function() {
                    map.removeOverlay(marker);
                }, 5000);

                // Hide search UI
                searchInput.hide().val('');
                resultsList.hide();
            }
        });

        // Close results when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.nominatim-search').length) {
                resultsList.hide();
            }
        });

        return container[0];
    };

    // Add the search control to the map
    map.addControl(new ol.control.Control({
        element: searchControlBuild()
    }));
} 