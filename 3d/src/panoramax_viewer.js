/**
 * PanoraMax Viewer Implementation
 */
function initPanoraMaxViewer(map) {
    // Create viewer container
    var viewerContainer = $('<div>').addClass('panoramax-viewer')
        .append($('<button>').addClass('close-button').html('<i class="fa fa-times"></i>'))
        .append($('<div>').addClass('resize-handle'))
        .append($('<div>').addClass('credits')
            .append($('<div>').addClass('credit').html('© <a href="https://panoramax.xyz" target="_blank">Panoramax</a>'))
            .append($('<div>').addClass('credit').html('© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'))
            .append($('<div>').addClass('credit').html('© <span class="photographer"></span>')))
        .append($('<iframe>').attr('id', 'panoramax-iframe'));
    
    $('body').append(viewerContainer);

    // Create viewer button control
    var viewerControlBuild = function() {
        var container = $('<div>').addClass('ol-control ol-unselectable osmcat-panoramax');
        
        // Map view button
        var mapViewButton = $('<button type="button">')
            .html('<i class="fa fa-street-view"></i>')
            .on('click', function() {
                if ($('.panoramax-viewer').hasClass('active')) {
                    hidePanoraMaxViewer();
                } else {
                    // Hide Mapillary viewer if it's active
                    if ($('.mapillary-viewer').hasClass('active')) {
                        hideMapillaryViewer();
                        $('.osmcat-mapillary button').removeClass('active');
                    }
                    var center = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
                    var zoom = map.getView().getZoom();
                    showPanoraMaxViewer(center[1], center[0], zoom);
                }
                $(this).toggleClass('active');
            });
        
        container.append(mapViewButton);
        return container[0];
    };

    // Add the viewer control to the map
    map.addControl(new ol.control.Control({
        element: viewerControlBuild()
    }));

    // Handle viewer close button
    $('.panoramax-viewer .close-button').on('click', function() {
        hidePanoraMaxViewer();
        $('.osmcat-panoramax button').removeClass('active');
    });

    // Listen for messages from the iframe
    window.addEventListener('message', function(event) {
        if (event.origin !== 'https://panoramax.xyz') return;
        
        if (event.data && event.data.photographer) {
            $('.panoramax-viewer .photographer').text(event.data.photographer);
        }
    });

    // Make viewer resizable
    $('.panoramax-viewer').resizable({
        handles: 'e, s, se',
        minWidth: 300,
        minHeight: 200,
        resize: function(event, ui) {
            $('.panoramax-viewer iframe').css({
                width: ui.size.width,
                height: ui.size.height - 30 // Account for credits height
            });
        }
    });

    // Function to show the viewer
    function showPanoraMaxViewer(lat, lon, zoom) {
        // Build URL with official parameters
        var url = `https://panoramax.xyz/#` +
            `focus=map&` + // Force map view
            `map=${zoom}/${lat}/${lon}&` + // Map position
            `nav=any&` + // Allow navigation between pictures
            `theme=default&` + // Use default theme for markers
            `background=streets&` + // Use streets background
            `meta=none`; // Hide metadata section to show more map
        
        var iframe = $('#panoramax-iframe');
        
        // Force reload the iframe with new coordinates
        iframe.attr('src', 'about:blank');
        setTimeout(function() {
            iframe.attr('src', url);
        }, 100);
        
        $('.panoramax-viewer').addClass('active');
        $('#map').addClass('viewer-active');
    }

    // Function to hide the viewer
    function hidePanoraMaxViewer() {
        $('.panoramax-viewer').removeClass('active');
        $('#map').removeClass('viewer-active');
        setTimeout(function() {
            $('#panoramax-iframe').attr('src', '');
        }, 300);
    }

    // Handle map click events
    map.on('click', function(evt) {
        if ($('.panoramax-viewer').hasClass('active')) {
            var coords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
            var zoom = map.getView().getZoom();
            showPanoraMaxViewer(coords[1], coords[0], zoom);
        }
    });
} 