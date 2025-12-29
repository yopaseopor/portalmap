/**
 * Mapillary Viewer Implementation - Works like router button
 *
 * This implementation creates a toggle button that shows/hides Mapillary content
 * in the side menu, exactly like the routing functionality.
 */
function initMapillaryViewer(map) {
    // Create Mapillary vector layer for coverage visualization
    var mapillarySource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        loader: function(extent, resolution, projection) {
            var epsg4326Extent = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
            var bbox = epsg4326Extent.join(',');

            // Fetch Mapillary coverage data using CORS proxy to avoid CORS issues
            var apiUrl = 'https://graph.mapillary.com/images?bbox=' + bbox + '&limit=100&fields=id,geometry';

            // Add API key if available in config
            if (typeof config !== 'undefined' && config.apiKeys && config.apiKeys.mapillary) {
                apiUrl += '&access_token=' + config.apiKeys.mapillary;
                console.log('Using Mapillary API key for authenticated access');
            } else {
                console.warn('No Mapillary API key configured. Using public access (limited functionality)');
            }

            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.contents) {
                        var mapillaryData = JSON.parse(data.contents);
                        if (mapillaryData && mapillaryData.data) {
                            var features = mapillaryData.data.map(function(image) {
                                return new ol.Feature({
                                    geometry: new ol.geom.Point(ol.proj.fromLonLat([
                                        image.geometry.coordinates[0],
                                        image.geometry.coordinates[1]
                                    ])),
                                    id: image.id
                                });
                            });
                            mapillarySource.addFeatures(features);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching Mapillary data:', error);
                    console.warn('Mapillary API requires authentication. Coverage layer may not work without API key.');
                });
        },
        strategy: ol.loadingstrategy.bbox
    });

    var mapillaryLayer = new ol.layer.Vector({
        source: mapillarySource,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 4,
                fill: new ol.style.Fill({
                    color: '#05CB63'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 1
                })
            })
        })
    });

    map.addLayer(mapillaryLayer);
    mapillaryLayer.setVisible(false); // Initially hidden

    // Handle map click events for Mapillary
    var mapillaryClickHandler = null;

    // Add Mapillary button that works like router button
    const mapillaryButton = $('<button>')
        .addClass('osmcat-button osmcat-mapillary')
        .attr('title', 'Street View')
        .html('<i class="fa fa-camera" aria-hidden="true"></i>');

    // Create a control element for the Mapillary button (outside button callback)
    const mapillaryControl = new ol.control.Control({
        element: mapillaryButton[0]
    });

    // Add the Mapillary control to the map
    map.addControl(mapillaryControl);

    // Button click handler
    mapillaryButton.on('click', function() {
        // Check if Mapillary section already exists in menu
        const existingMapillary = $('.osmcat-menu .osmcat-layer').filter(function() {
            return $(this).find('.osmcat-select').text() === 'Street View';
        });

        if (existingMapillary.length > 0) {
            // Mapillary section exists, close it
            if (mapillaryClickHandler) {
                map.un('singleclick', mapillaryClickHandler);
                mapillaryClickHandler = null;
            }
            existingMapillary.remove();
            mapillaryButton.removeClass('active');
            mapillaryLayer.setVisible(false); // Hide layer when closing
            return;
        }

        // Mapillary section doesn't exist, create it
        mapillaryButton.addClass('active');
        mapillaryLayer.setVisible(true); // Show layer when opening

        // Create Mapillary content
        createMapillaryContent();
    });

    // Function to create Mapillary content (outside button callback)
    function createMapillaryContent() {
        // Handle clicks on map for Mapillary
        mapillaryClickHandler = function(evt) {
            var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
                return feature;
            });

            if (feature && feature.get('id')) {
                var coords = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
                var zoom = map.getView().getZoom();
                showMapillaryInMenu(coords[1], coords[0], zoom, feature.get('id'));
            }
        };

        map.on('singleclick', mapillaryClickHandler);

        // Update coordinates when clicking on coverage
        function showMapillaryInMenu(lat, lon, zoom, imageId) {
            var url = `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=${Math.max(1, Math.min(20, zoom))}&style=photo`;

            if (imageId) {
                url += `&imageKey=${imageId}`;
            }

            console.log('Mapillary URL:', url);

            // Update the menu content with coordinates
            $('.mapillary-section .preview-coords').html(`<strong>${lat.toFixed(6)}, ${lon.toFixed(6)}</strong><br><small>Zoom: ${zoom}</small>`);

            // Update the button click handler
            $('.mapillary-section .open-mapillary-btn').off('click').on('click', function() {
                window.open(url, 'mapillary', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            });
        }

        // Create a simple container for Mapillary content
        const mapillaryContainer = $(`
            <div class="mapillary-section" style="margin: 10px 0; padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
                <div class="mapillary-header" style="font-weight: bold; margin-bottom: 10px; cursor: pointer; color: #567CAC;">
                    <span data-i18n="streetViewTitle">📷 Street View (click to close)</span>
                </div>
                <div class="mapillary-content">
                    <div class="mapillary-notice">
                        <i class="fa fa-street-view"></i><br>
                        <strong data-i18n="mapillaryStreetView">Mapillary Street View</strong><br>
                        <small data-i18n="clickBelowOpenImagery">Click below to open street-level imagery in a new window</small>
                    </div>
                    <div class="mapillary-preview">
                        <div class="preview-info">
                            <div class="preview-title" data-i18n="locationPreview">Location Preview</div>
                            <div class="preview-coords" data-i18n="clickMapSetLocation">Click on the map to set a location</div>
                        </div>
                        <div class="preview-map">
                            <small data-i18n="interactiveMapOpenNewWindow">Interactive map will open in new window</small>
                        </div>
                    </div>
                    <button class="open-mapillary-btn">
                        <i class="fa fa-external-link"></i> <span data-i18n="openMapillary">Open Mapillary</span>
                    </button>
                </div>
            </div>
        `);

        // Handle clicks on the Mapillary section header to close it
        mapillaryContainer.find('.mapillary-header').on('click', function() {
            if (mapillaryClickHandler) {
                map.un('singleclick', mapillaryClickHandler);
                mapillaryClickHandler = null;
            }
            mapillaryContainer.remove();
            mapillaryButton.removeClass('active');
            mapillaryLayer.setVisible(false);
        });

        // Set up initial button click handler (for current map center)
        mapillaryContainer.find('.open-mapillary-btn').on('click', function(e) {
            e.preventDefault();
            var center = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
            var zoom = map.getView().getZoom();
            var url = `https://www.mapillary.com/app/?lat=${center[1]}&lng=${center[0]}&z=${zoom}&style=photo`;
            window.open(url, 'mapillary', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        });

        // Insert Mapillary content in the menu
        var $menu = $('.menu');
        if ($menu.find('#overlay-list').length > 0) {
            mapillaryContainer.insertBefore($menu.find('#overlay-list'));
        } else {
            $menu.append(mapillaryContainer);
        }

        // Remove any existing Mapillary content (cleanup)
        $('.menu .mapillary-section').not(mapillaryContainer).remove();

        // Update translations for the newly created content
        if (window.updateTranslations) {
            window.updateTranslations();
        }
    }
} 