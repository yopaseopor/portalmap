/* global config, ol */
$(function () {

    // --- Layer Searcher Integration ---
    // Remove early addition of 'Translated' overlay group here. It will be added after all overlays are loaded.

    // 1. Flatten base layers into window.layers
    window.layers = [];
    if (config && Array.isArray(config.layers)) {
        config.layers.forEach(function(layerOrGroup) {
            if (layerOrGroup instanceof ol.layer.Group) {
                // If it's a group, add all sublayers
                layerOrGroup.getLayers().forEach(function(subLayer) {
                    if (subLayer.get && subLayer.get('type') !== 'overlay') {
                        window.layers.push({
                            title: subLayer.get('title') || '',
                            group: layerOrGroup.get('title') || '',
                            id: subLayer.get('id') || '',
                            _olLayerGroup: subLayer
                        });
                    }
                });
            } else if (layerOrGroup.get && layerOrGroup.get('type') !== 'overlay') {
                // If it's a single layer, add directly
                window.layers.push({
                    title: layerOrGroup.get('title') || '',
                    group: layerOrGroup.get('group') || '',
                    id: layerOrGroup.get('id') || '',
                    _olLayerGroup: layerOrGroup
                });
            }
        });
    }
    // 2. Define window.renderLayerList - Modified to prevent rendering the layer list
    window.renderLayerList = function(filtered, query) {
        // Remove the layer list if it exists
        $('#layer-list').remove();
        
        // If there's a search query, we'll still process the layers but not show them
        if (query && filtered && filtered.length > 0) {
            // Find the active layer if any
            var activeLayer = null;
            $.each(config.layers, function(indexLayer, layerGroup) {
                if (layerGroup.get && layerGroup.get('type') !== 'overlay' && layerGroup.getVisible && layerGroup.getVisible()) {
                    activeLayer = layerGroup;
                }
            });
            
            // If a layer is being activated, handle it without showing the list
            filtered.forEach(function(layer) {
                var isActive = activeLayer && ((layer.id && activeLayer.get('id') === layer.id) || 
                             (activeLayer.get('title') === layer.title && activeLayer.get('group') === layer.group));
                
                // If this is the layer being activated, call activateLayer
                if (isActive && window.activateLayer) {
                    window.activateLayer(layer);
                }
            });
        }
    };


    // Render all layers initially
    $(document).ready(function() {
        window.renderLayerList(window.layers);
    });
    // --- End Layer Searcher Integration ---

    // --- Overlay Searcher Integration ---
    // 1. Initialize window.allOverlays
    // window.allOverlays is initialized in overlays/index.js and overlays are imported as arrays, not functions.
    // Do not re-initialize overlays here. Use window.allOverlays as the source of truth.
    if (!window.allOverlays) {
        console.error('window.allOverlays is not defined. Make sure overlays/index.js is loaded before index.js.');
        window.allOverlays = {};
    }
    window.overlays = [];
    function updateWindowOverlays() {
        // Only flatten overlays for the overlay searcher
        window.overlays = Object.entries(window.allOverlays).reduce((acc, [groupName, overlays]) => {
            if (Array.isArray(overlays)) {
                return acc.concat(overlays.map(overlay => ({
                    // Use already translated values
                    title: overlay.title || '',
                    group: overlay.group || '',
                    id: overlay.id || '',
                    ...overlay
                })));
            }
            return acc;
        }, []);
    }

    // Update overlays when they change
    window.addEventListener('overlaysUpdated', function() {
        // Overlays are updated by overlays/index.js
        // updateTranslatedOverlayGroup(); // Function doesn't exist, removed
        if (window.updateTranslations) window.updateTranslations();
        updateWindowOverlays(); // Refresh overlays for searcher
        if (window.renderOverlayList && window.overlays) window.renderOverlayList(window.overlays);

        // Instead of completely rebuilding the menu, just update the overlay sections
        const $existingMenu = $('.osmcat-menu');
        if ($existingMenu.length) {
            // Update existing menu without removing it entirely
            const overlaySelect = $existingMenu.find('.osmcat-select');
            if (overlaySelect.length) {
                // Update the overlay selector options if it exists
                updateOverlaySelector(overlaySelect);
            }
        } else {
            // Rebuild the layers control only if it doesn't exist
            $('#menu').prepend(layersControlBuild());
        }
    });

    function updateOverlaySelector(overlaySelect) {
        // Update the overlay selector options
        overlaySelect.empty();
        let overlayIndex = 0;

        config.layers.forEach(layer => {
            if (layer.get('type') === 'overlay') {
                const originalTitle = layer.get('originalTitle') || layer.get('title');
                const title = window.getTranslation ? window.getTranslation(originalTitle) : originalTitle;

                overlaySelect.append($('<option>').val('overlay' + overlayIndex).text(title));
                overlayIndex++;
            }
        });

        overlaySelect.trigger('change');
    }

    // Store the current UI state
    function getUIState() {
        const state = {
            // Store visible layers
            visibleLayers: window.config.layers
                .filter(layer => layer.getVisible())
                .map(layer => layer.get('title')),
            // Store expanded overlay groups
            expandedGroups: []
        };
        
        // Store which overlay groups are expanded
        $('.osmcat-menu h3').each(function() {
            const $h3 = $(this);
            const $content = $h3.next('.osmcat-content');
            if ($content.is(':visible')) {
                state.expandedGroups.push($h3.text().trim());
            }
        });
        
        return state;
    }
    
    // Restore the UI state
    function restoreUIState(state) {
        if (!state) return;
        
        // Batch layer visibility updates
        if (state.visibleLayers) {
            // First, collect all layer updates
            const updates = [];
            const layerTitles = new Map();
            
            // Create a map of layer titles to their translations
            window.config.layers.forEach(layer => {
                const layerTitle = layer.get('title');
                if (layerTitle) {
                    layerTitles.set(layerTitle, layer);
                    // Also store the translated version for matching
                    const translatedTitle = window.getTranslation ? window.getTranslation(layerTitle) : layerTitle;
                    if (translatedTitle !== layerTitle) {
                        layerTitles.set(translatedTitle, layer);
                    }
                }
            });
            
            // Process each visible layer from the state
            state.visibleLayers.forEach(visibleTitle => {
                const layer = layerTitles.get(visibleTitle);
                if (layer) {
                    updates.push({ layer, visible: true });
                } else {
                    // Try to find by translated title
                    const translatedTitle = window.getTranslation ? window.getTranslation(visibleTitle) : visibleTitle;
                    const translatedLayer = layerTitles.get(translatedTitle);
                    if (translatedLayer) {
                        updates.push({ layer: translatedLayer, visible: true });
                    }
                }
            });
            
            // Apply all visibility updates in a single batch
            updates.forEach(({ layer, visible }) => {
                layer.setVisible(visible);
            });
        }
        
        // Restore expanded groups
        if (state.expandedGroups && state.expandedGroups.length > 0) {
            // Create a set of expanded group titles for faster lookup
            const expandedGroups = new Set(state.expandedGroups);
            
            // Process each group header
            $('.osmcat-menu h3').each(function() {
                const $h3 = $(this);
                const groupTitle = $h3.text().trim();
                const $content = $h3.next('.osmcat-content');
                
                // Check if this group should be expanded
                const shouldExpand = state.expandedGroups.some(expandedTitle => 
                    groupTitle === expandedTitle || 
                    groupTitle === (window.getTranslation ? window.getTranslation(expandedTitle) : expandedTitle) ||
                    (window.getTranslation ? window.getTranslation(groupTitle) : groupTitle) === expandedTitle
                );
                
                // Use direct DOM manipulation for better performance
                $content.toggle(shouldExpand);
                $h3.toggleClass('expanded', shouldExpand);
            });
        }
    }
    
    // Listen for language changes
    window.addEventListener('languageChanged', function() {
        // Save current scroll position
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        
        // Save current UI state
        const uiState = getUIState();
        
        // Temporarily hide the menu to prevent jumping
        const $menu = $('.osmcat-menu');
        const menuHeight = $menu.outerHeight();
        const $menuPlaceholder = $('<div>').css('height', menuHeight + 'px').css('visibility', 'hidden');
        $menu.after($menuPlaceholder);
        
        // Re-initialize overlays with the new language
        if (window.getAllOverlays) {
            // Update the overlays with the new language
            window.allOverlays = window.getAllOverlays();
            
            // Recreate all overlay layers
            if (window.integrateOverlays) {
                window.integrateOverlays();
            }
            
            // Update the UI in a way that minimizes jumping
            requestAnimationFrame(() => {
                // Remove the old menu
                $menu.remove();
                
                // Create the new menu off-screen
                const $newMenu = $(layersControlBuild()).css({
                    position: 'absolute',
                    left: '-9999px',
                    top: '0',
                    visibility: 'hidden'
                });
                
                // Insert the new menu
                $menuPlaceholder.after($newMenu);
                
                // Update the overlay list if the function exists
                if (window.renderOverlayList && window.overlays) {
                    window.renderOverlayList(window.overlays);
                }
                
                // Restore the UI state
                restoreUIState(uiState);
                
                // Get the new height after all updates
                const newHeight = $newMenu.outerHeight();
                
                // Update the placeholder height to match the new menu
                $menuPlaceholder.css('height', newHeight + 'px');
                
                // Show the new menu and remove the placeholder
                requestAnimationFrame(() => {
                    $newMenu.css({
                        position: '',
                        left: '',
                        top: '',
                        visibility: ''
                    });
                    
                    $menuPlaceholder.remove();
                    
                    // Restore scroll position
                    window.scrollTo(0, scrollPosition);
                });
            });
        }
    });

    // Initial update
    updateWindowOverlays();

    // 2. Define window.renderOverlayList - DISABLED
    window.renderOverlayList = function(filtered, query) {
        // Overlay list is disabled - do nothing
        console.log('📋 Overlay list rendering disabled');
    };



    // Toggle the chosen overlay independently - DISABLED
    window.activateOverlay = function(overlay) {
        // Overlay activation is disabled - do nothing
        console.log('🎯 Overlay activation disabled');
    };

    // Render all overlays initially - DISABLED
    $(document).ready(function() {
        // Overlay list rendering is disabled
        console.log('📋 Initial overlay list rendering disabled');
    });
    // --- End Overlay Searcher Integration ---


	$('#map').empty(); // Remove Javascript required message
	var baseLayerIndex = 0;
	
	//Object to manage the spinner layer
	var loading = {
		count: 0,
		spinner: $('<div>').addClass('ol-control osmcat-loading').html('<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>'),
		show: function () {
			if (!this.spinner.parent().length) {
				$('#map').append(this.spinner);
			}
			this.spinner.show();
			++this.count;
		},
		hide: function () {
			--this.count;
			if (this.count < 1) {
				this.spinner.hide();
				this.count = 0;
			}
		}
	};
	// Export loading to global scope for other modules
	window.loading = loading;

	var overlaysTemp = {};
	$.each(config.overlays, function (index, overlay) {
		var layerGroup = overlay['group'],
				vectorProperties = overlay,
				vector;

		if (overlay['geojson'] !== undefined) {
      var vectorSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: overlay['geojson']
      })
    } else {
			var vectorSource = new ol.source.Vector({ 
			format: new ol.format.OSMXML2(),
			loader: function (extent, resolution, projection) {
				loading.show();
				var me = this;
				var epsg4326Extent = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
				var query = '[maxsize:536870912];' + overlay['query']; // Memory limit 512 MiB
				//var query = layerQuery;
				query = query.replace(/{{bbox}}/g, epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' + epsg4326Extent[3] + ',' + epsg4326Extent[2]);

				var client = new XMLHttpRequest();
				client.open('POST', config.overpassApi());
				client.onloadend = function () {
					loading.hide();
				};
				client.onerror = function () {
					console.error('[' + client.status + '] Error loading data.');
					me.removeLoadedExtent(extent);
					vector.setVisible(false);
				};
				client.onload = function () {
					if (client.status === 200) {
						var xmlDoc = $.parseXML(client.responseText),
								xml = $(xmlDoc),
								remark = xml.find('remark'),
								nodosLength = xml.find('node').length;

						if (remark.length !== 0) {
							console.error('Error:', remark.text());
							$('<div>').html(remark.text()).dialog({
								modal: true,
								title: 'Error',
								close: function () {
									$(this).dialog('destroy');
								}
							});
							client.onerror.call(this);
						} else {
							console.log('Nodes Found:', nodosLength);
							if (nodosLength === 0) {
								$('<div>').html(config.i18n.noNodesFound).dialog({
									modal: true,
									//title: 'Error',
									close: function () {
										$(this).dialog('destroy');
									}
								});
							}
							var features = new ol.format.OSMXML2().readFeatures(xmlDoc, {
								featureProjection: map.getView().getProjection()
							});
							me.addFeatures(features);
						}
					} else {
						client.onerror.call(this);
					}
				};
				client.send(query);
			},
			strategy: ol.loadingstrategy.bbox
		});
	}
		vectorProperties['source'] = vectorSource;
		vectorProperties['visible'] = false;

		vector = new ol.layer.Vector(vectorProperties);

		if (overlaysTemp[layerGroup] !== undefined) {
			overlaysTemp[layerGroup].push(vector);
		} else {
			overlaysTemp[layerGroup] = [vector];
		}
	});

	$.each(overlaysTemp, function (index, value) {
		var layerGroup = new ol.layer.Group({
			title: index,
			type: 'overlay',
			layers: value
		});
		config.layers.push(layerGroup);
	});

	var round = function (value, decimals) {
	  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
	};
	//Permalink
	var vars = {},
		getUrlParam = function(param, defaultValue) {
			var r = vars[param];
			if (typeof r === 'undefined') {
				r = defaultValue;
			}
			return r;
		};

	if (window.location.hash !== '') {
		window.location.hash.replace(/[#?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
			vars[key] = decodeURIComponent(value);
		});
		
		
		// map = zoom, center (lon, lat), [rotation]
		var mapParam = getUrlParam('map', ''), parts;
		if (mapParam !== '') {
			parts = mapParam.split('/');
			config.initialConfig.zoom = parseFloat(parts[0]);
			config.initialConfig.lat = parseFloat(parts[1]);
			config.initialConfig.lon = parseFloat(parts[2]);
			if (typeof parts[3] !== 'undefined') {
				config.initialConfig.rotation = parseFloat(parts[3]);
			}
		}

		// base = index
		var baseParam = parseInt(getUrlParam('base', 0), 10);
		
		// tag queries from URL
		var tagQueryParams = [];
		Object.keys(vars).forEach(function(key) {
			if (key.startsWith('tag.') || (key === 'tag' && vars[key].includes('='))) {
				// Handle tag.key=value format
			if (key.startsWith('tag.')) {
				const tagKey = key.substring(4); // Remove 'tag.' prefix
				tagQueryParams.push({key: tagKey, value: vars[key]});
			} else if (key === 'tag') {
				// Handle tag=key=value format
				const tagParts = vars[key].split('=');
				if (tagParts.length === 2) {
					tagQueryParams.push({key: tagParts[0], value: tagParts[1]});
				}
			}
		}
		});
		
		$.each(config.layers, function(indexLayer, layer) {
			if (layer.get('type') === 'overlay') {
				// overlays
				var overlayParam = getUrlParam(layer.get('title'), '');
				$.each(layer.getLayers().getArray(), function (overlayIndex, overlayValue) {
					overlayValue.setVisible(!!parseInt(overlayParam.charAt(overlayIndex)));
				});
			} else {
				// overlays
				if (indexLayer === baseParam) {
					layer.setVisible(true);
				} else {
					layer.setVisible(false);
				}
			}
		});
		
		// Store tag queries for later execution
		if (tagQueryParams.length > 0) {
			window.initialTagQueries = tagQueryParams;
		}
	}

	var view = new ol.View({
		center: ol.proj.fromLonLat([config.initialConfig.lon, config.initialConfig.lat]), // Transform coordinate from EPSG:3857 to EPSG:4326
		rotation: config.initialConfig.rotation,
		zoom: config.initialConfig.zoom
	});

	const map = new ol.Map({
		layers: config.layers,
		target: 'map',
		view: view
	});

	// Export map to global scope for other modules
	window.map = map;

    // Initialize Nominatim search
    initNominatimSearch(map);

	// Initialize Taginfo API
	initTaginfoAPI().then(() => {
		console.log('Taginfo API initialized');

		// Wait for translations to be initialized before starting search modules
		const waitForTranslations = () => {
			if (typeof window.getTranslation === 'function') {
				console.log('🔍 Translations available, initializing search modules');
				// Initialize search modules after taginfo is ready AND translations are available
				initKeySearch();
				initValueSearch();

				// Execute tag queries from URL if any
				if (window.initialTagQueries && window.initialTagQueries.length > 0) {
					console.log('🔍 Executing tag queries from URL:', window.initialTagQueries);
					window.initialTagQueries.forEach(tagQuery => {
						if (window.executeTagQuery && typeof window.executeTagQuery === 'function') {
							window.executeTagQuery(tagQuery.key, tagQuery.value);
						}
					});
					// Clear the stored queries after execution
					window.initialTagQueries = [];
				}

				// Set up event listeners for tag query URL updates
				setupTagQueryEventListeners();
			} else {
				setTimeout(waitForTranslations, 50);
			}
		};

		waitForTranslations();
	}).catch(error => {
		console.error('Failed to initialize Taginfo API:', error);
		// Still initialize search modules even if taginfo fails
		initKeySearch();
		initValueSearch();

		// Set up event listeners even if taginfo fails
		setupTagQueryEventListeners();
	});

    // Initialize PanoraMax viewer
    initPanoraMaxViewer(map);

    // Initialize Mapillary viewer
    initMapillaryViewer(map);

    // Ensure window.initRouter is set after router.js loads
    if (typeof window.initRouter !== 'function' && typeof initRouter === 'function') {
        window.initRouter = initRouter;
    }

    // Always show and activate the .osmcat-router button (no random button)
    $(".osmcat-routerbutton").remove(); // Remove any previous router controls
    // Ensure the router menu is always shown and active
    if (typeof window.initRouter === 'function') {
        window.initRouter(map);
    } else {
        alert('Router module is not loaded.');
    }
    $('.osmcat-menu').addClass('router-active');
    $('.osmcat-router').addClass('active');


	var layersControlBuild = function () {
		var visibleLayer,
			previousLayer,
			layerIndex = 0,
			overlayIndex = 0,
			container = $('<div>').addClass('osmcat-menu'),
			layerDiv = $('<div>').addClass('osmcat-layer'),
			overlaySelect = $('<select>').addClass('osmcat-select').on('change', function () {
				var overlaySelected = $(this).find('option:selected');

				container.find('.osmcat-overlay').hide();
				container.find('.' + overlaySelected.val()).show();
			}),
			overlayDiv = $('<div>').hide().addClass('osmcat-layer').append($('<div>').append(overlaySelect)),
			label = $('<div>').html('<b>&equiv; ' + config.i18n.layersLabel + '</b>').on('click', function () {
				content.toggle();
			}),
			content = $('<div>').addClass('osmcat-content');

		config.layers.forEach(layer => {
			if (layer.get('type') === 'overlay') {
				// Get the translated title, fallback to original title if translation not available
				const originalTitle = layer.get('originalTitle') || layer.get('title');
				const title = window.getTranslation ? window.getTranslation(originalTitle) : originalTitle;
				
				// Ensure the layer's title is up to date
				if (layer.get('title') !== title) {
					layer.set('title', title);
				}
				
				var layerButton = $('<h3>').html(title),
					overlayDivContent = $('<div>').addClass('osmcat-content osmcat-overlay overlay' + overlayIndex);

				overlaySelect.append($('<option>').val('overlay' + overlayIndex).text(title));

				layer.getLayers().forEach(overlay => {
					var overlaySrc = overlay.get('iconSrc'),
						overlayIconStyle = overlay.get('iconStyle') || '',
						title = (overlaySrc ? '<img src="' + overlaySrc + '" height="16" style="' + overlayIconStyle + '"/> ' : '') + overlay.get('title'),
						overlayButton = $('<div>').html(title).on('click', function () {
							var visible = overlay.getVisible();
							overlay.setVisible(!visible);
							updatePermalink();
						}),
						checkbox = $('<input type="checkbox">').css({marginRight:'6px'});
					
					checkbox.prop('checked', overlay.getVisible());
					checkbox.on('change', function() {
						overlay.setVisible(this.checked);
						updatePermalink();
					});
					overlayButton.prepend(checkbox);
					overlay.on('change:visible', function() {
						checkbox.prop('checked', overlay.getVisible());
						if (overlay.getVisible()) {
							overlayButton.addClass('active');
						} else {
							overlayButton.removeClass('active');
						}
					});
					overlayDivContent.append(overlayButton);
				});
				overlayDiv.append(overlayDivContent);
				overlayDiv.show();
				overlayIndex++;
			} else {
				var layerSrc = layer.get('iconSrc'),
					title = (layerSrc ? '<img src="' + layerSrc + '" height="16"/> ' : '') + layer.get('title'),
					layerButton = $('<div>').html(title).on('click', function () {
						var visible = layer.getVisible();

						if (visible) { //Show the previous layer
							if (previousLayer) {
								baseLayerIndex = previousLayer.get('layerIndex');
								layer.setVisible(!visible);
								previousLayer.setVisible(visible);
								visibleLayer = previousLayer;
								previousLayer = layer;
							}
						} else { //Active the selected layer and hide the current layer
							baseLayerIndex = layer.get('layerIndex');
							layer.setVisible(!visible);
							if (visibleLayer) {
								visibleLayer.setVisible(visible);
							}
							previousLayer = visibleLayer;
							visibleLayer = layer;
						}
						updatePermalink();
					});

					layer.set('layerIndex', layerIndex);

					// Add checkbox for enabling/disabling layer
					var checkbox = $('<input type="checkbox">').css({marginRight:'6px'});
					checkbox.prop('checked', layer.getVisible());
					checkbox.on('change', function() {
						layer.setVisible(this.checked);
					});
					layerButton.prepend(checkbox);

					content.append(layerButton);
					layer.on('change:visible', function () {
						checkbox.prop('checked', layer.getVisible());
						if (layer.getVisible()) {
							layerButton.addClass('active');
						} else {
							layerButton.removeClass('active');
						}
					});
				layerIndex++;
			}
		});
		layerDiv.append(label, content);
		container.append(layerDiv, overlayDiv);
		overlaySelect.trigger('change');

		return container;
	};

    // Insert layer selector right after element type filter
    $('.element-type-filter').after(layersControlBuild());
    // Optionally, re-render layers after layersControl if needed
    if (window.renderLayerList && window.layers) window.renderLayerList(window.layers);
    // Overlay list rendering is disabled - no need to re-render overlays

	map.addControl(new ol.control.MousePosition({
		coordinateFormat: function (coordinate) {
			return ol.coordinate.format(coordinate, '[{y}, {x}]', 5);
		},
		projection: 'EPSG:4326'
	}));
	map.addControl(new ol.control.ScaleLine({units: config.initialConfig.units}));
    // Overlay summary control (positioned next to scale bar)
    var overlaySummaryDiv = $('<div>').addClass('ol-control ol-unselectable overlay-summary-control').css({
        // Positioning handled by CSS
    });
    var overlaySummaryControl = new ol.control.Control({
        element: overlaySummaryDiv[0]
    });
    map.addControl(overlaySummaryControl);
    // Expose global setter
    window.setOverlaySummary = function(text) {
        if (text) {
            overlaySummaryDiv.text(text).show();
        } else {
            overlaySummaryDiv.hide();
        }
    };
    map.addControl(new ol.control.ZoomSlider());
	



	// Geolocation Control
	// In some browsers, this feature is available only in secure contexts (HTTPS)
	var geolocationControlBuild = function () {
		var container = $('<div>').addClass('ol-control ol-unselectable osmcat-geobutton').html($('<button type="button"><i class="fa fa-bullseye"></i></button>').on('click', function () {
			if (navigator.geolocation) {
				if (location.protocol !== 'https') {
					console.warn('In some browsers, this feature is available only in secure context (HTTPS)');
				}
				navigator.geolocation.getCurrentPosition(function (position) {
					var latitude = position.coords.latitude;
					var longitude = position.coords.longitude;

					view.animate({
						zoom: config.initialConfig.zoomGeolocation,
						center: ol.proj.fromLonLat([longitude, latitude])
					});
				}, function (error) {
					console.error(error.message, error);
					alert(error.message);
				});
			} else {
				console.error('Geolocation is not supported by your browser');
			}
		}));
		return container[0];
	};

	// Clear Overlay Control
	var clearOverlayControlBuild = function () {
		var container = $('<div>').addClass('ol-control ol-unselectable osmcat-clearoverlaybutton').html(
			$('<button type="button" class="clear-active-overlay-btn" title="Clear Active Overlay"><i class="fa fa-times"></i></button>').on('click', function () {
				// Hide all overlays
				$.each(config.layers, function(indexLayer, layerGroup) {
					if (layerGroup.get && layerGroup.get('type') === 'overlay') {
						$.each(layerGroup.getLayers().getArray(), function(idx, olayer) {
							if (olayer.setVisible) olayer.setVisible(false);
						});
					}
				});

				// Also clear Tag Queries layers if the function exists
				if (window.clearMapLayers) {
					window.clearMapLayers();
				}

				// Overlay list is disabled - no need to update it
				$('#overlay-search').val('');
                    if (window.updateOverlaySummary) window.updateOverlaySummary();
			})
		);
		return container[0];
	};

	map.addControl(new ol.control.Control({
        element: geolocationControlBuild()
    }));
    // Add Clear Overlay control just after Rotate control (if present)
    // Try to find the rotate control element and insert after it
    setTimeout(function() {
        var rotateControl = $('.ol-rotate');
        var clearOverlayControl = $(clearOverlayControlBuild());
        if (rotateControl.length) {
            rotateControl.after(clearOverlayControl);
        } else {
            // fallback: add to map as usual
            $('#map').append(clearOverlayControl);
        }
    }, 0);

	
	
	// Como crear un control
	//@@ poner un número extra a la var | var infoControlBuild2 = function () {
	//@@ revisar osmcat-infobutton2 	var container = $('<div>').addClass('ol-control ol-unselectable osmcat-infobutton2').html($('<button type="button"><i class="fa fa-search-plus"></i></button>').on('click', function () {
	//		window.location.href = 'https://mapcomplete.osm.be/index.html?userlayout=https://raw.githubusercontent.com/yopaseopor/mcquests/master/limits.json';
	//	}));
	//	return container[0];
	//};
	//map.addControl(new ol.control.Control({
	//	element: infoControlBuild2()
	//}));

	// Info Control
	var infoControlBuild = function () {
		var container = $('<div>').addClass('ol-control ol-unselectable osmcat-infobutton').html($('<button type="button"><i class="fa fa-info-circle"></i></button>').on('click', function () {
			window.location.href = 'https://github.com/yopaseopor/osmutils';
		}));
		return container[0];
	};
	map.addControl(new ol.control.Control({
		element: infoControlBuild()
	}));
	
	// Copy permalink button
	var permalinkControlBuild = function () {
		var container = $('<div>').addClass('ol-control ol-unselectable osmcat-sharebutton').html($('<button type="button"><i class="fa fa-share-alt-square"></i></button>').on('click', function () {
			var dummyInput = $('<input>').val(window.location.href),
				successful = false;

			$('body').append(dummyInput);
			dummyInput.focus();
			dummyInput.select();
			successful = document.execCommand('copy');
			dummyInput.remove();
			if (successful) {
				var modalDialogTimeout,
					modalDialog = $('<div>').html(config.i18n.copyDialog).dialog({
					modal: true,
					resizable: false,
					close: function () {
						clearTimeout(modalDialogTimeout);
						$(this).dialog('destroy');
					}
				});
				modalDialogTimeout = setTimeout(function(){
					modalDialog.dialog('destroy');
				}, 3000);
			}
		}));
		return container[0];
	};
	map.addControl(new ol.control.Control({
		element: permalinkControlBuild()
	}));


	// Rotate left button
	var rotateleftControlBuild = function () {
		var container = $('<div>').addClass('ol-control ol-unselectable osmcat-rotateleft').html($('<button type="button"><i class="fa fa-undo"></i></button>').on('click', function () {
			var currentRotation = view.getRotation();
			if (currentRotation > -6.1) { //360º = 2 Pi r =aprox 6.2
				view.setRotation(round(currentRotation - 0.1, 2));
			} else {
				view.setRotation(0);
			}
		}));
		return container[0];
	};
	map.addControl(new ol.control.Control({
		element: rotateleftControlBuild()
	}));

	// Rotate right button
	var rotaterightControlBuild = function () {
		var container = $('<div>').addClass('ol-control ol-unselectable osmcat-rotateright').html($('<button type="button"><i class="fa fa-repeat"></i></button>').on('click', function () {
			var currentRotation = view.getRotation();
			if (currentRotation < 6.1) { //360º = 2 Pi r =aprox 6.2
				view.setRotation(round(currentRotation + 0.1, 2));
			} else {
				view.setRotation(0);
			}
		}));
		return container[0];
	};
	map.addControl(new ol.control.Control({
		element: rotaterightControlBuild()
	}));

	// Add mobile menu toggle button (only on mobile) - moved to after map is ready
	$(document).ready(function() {
		if (window.innerWidth <= 599 && window.map) {
			var menuToggleButton = $('<button>')
				.addClass('menu-toggle')
				.html('<i class="fa fa-bars"></i>')
				.on('click', function() {
					var $menu = $('.menu');
					var $flexRow = $('.flex-row');
					if ($menu.hasClass('menu-visible')) {
						$menu.removeClass('menu-visible');
						$flexRow.removeClass('menu-active');
					} else {
						$menu.addClass('menu-visible');
						$flexRow.addClass('menu-active');
					}
				});

			// Add the menu toggle button to the page
			$('body').append(menuToggleButton);
		}
	});

	$('#map').css('cursor', 'grab');
	map.on('movestart', function (evt) {
		$('#map').css('cursor', 'grabbing');
	});

	var shouldUpdate = true;
	// restore the view state when navigating through the history, see
	// https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
	window.addEventListener('popstate', function(event) {
		if (event.state === null) {
			return;
		}
		map.getView().setCenter(ol.proj.fromLonLat(event.state.center));
		map.getView().setZoom(event.state.zoom);
		map.getView().setRotation(event.state.rotation);

			// Restore tag queries from URL
			if (event.state.tagQueries && Array.isArray(event.state.tagQueries)) {
				event.state.tagQueries.forEach(tagQuery => {
					if (window.executeTagQuery && typeof window.executeTagQuery === 'function') {
						window.executeTagQuery(tagQuery.key, tagQuery.value);
					}
				});
			}

			$.each(config.layers, function(indexLayer, layer) {
				if (layer.get('type') === 'overlay') {
					// overlays
					var overlayParam = event.state.overlay[layer.get('title')];
					if (typeof overlayParam === 'undefined') {
						overlayParam = '';
					}
					$.each(layer.getLayers().getArray(), function (overlayIndex, overlayValue) {
						overlayValue.setVisible(!!parseInt(overlayParam.charAt(overlayIndex)));
					});
				} else {
					// overlays
					if (indexLayer === event.state.baseLayer) {
						layer.setVisible(true);
					} else {
						layer.setVisible(false);
					}
				}
			});

		shouldUpdate = false;
	});

	var updatePermalink = function() {
			if (!shouldUpdate) {
				// do not update the URL when the view was changed in the 'popstate' handler
				shouldUpdate = true;
				return;
			}

			var zoom = round(view.getZoom(), 3),
				center = ol.proj.toLonLat(view.getCenter()),
				rotation = round(view.getRotation(), 2),
				overlayState = {};

			var hash = '#map=' + zoom + '/' + round(center[1], 5) + '/' + round(center[0], 5) + '/' + rotation;
			if (baseLayerIndex !== 0) {
				hash += '&base=' + baseLayerIndex;
			}

			// Add tag queries to URL
			if (window.tagQueryLegend && window.tagQueryLegend.queries) {
				const visibleQueries = window.tagQueryLegend.getVisibleQueries();
				if (visibleQueries.length > 0) {
					visibleQueries.forEach(query => {
						hash += '&tag=' + encodeURIComponent(query.key) + '=' + encodeURIComponent(query.value);
					});
			}
			}

			$.each(config.layers, function(indexLayer, layer) {
				var hashOverlay = '', addHash = false;
				if (layer.get('type') === 'overlay') {
					// overlays
					$.each(layer.getLayers().getArray(), function (overlayIndex, overlayValue) {
						if (overlayValue.getVisible()) {
							hashOverlay += '1';
							addHash = true;
						} else {
							hashOverlay += '0';
						}
					});
					if (addHash) {
						hash += '&' + layer.get('title') + '=' + hashOverlay;
					}
					overlayState[layer.get('title')] = hashOverlay;
				}
			});

			var state = {
				zoom: zoom,
				center: center,
				rotation: rotation,
				baseLayer: baseLayerIndex,
				overlay: overlayState
			};

			// Add tag queries to state
			if (window.tagQueryLegend && window.tagQueryLegend.queries) {
				const visibleQueries = window.tagQueryLegend.getVisibleQueries();
				if (visibleQueries.length > 0) {
					state.tagQueries = visibleQueries;
				}
			}

			window.history.pushState(state, 'map', hash);
		};

	map.on('moveend', function (evt) {
		$('#map').css('cursor', 'grab');
		updatePermalink();
	});

	var selectedFeature = null;
	map.on('pointermove', function (evt) {
		if (selectedFeature !== null) {
			if (typeof selectedFeature.setStyle === 'function') {
                selectedFeature.setStyle(undefined);
            }
			selectedFeature = null;
			$('#map').css('cursor', 'grab');
		}
		map.forEachFeatureAtPixel(evt.pixel, function (feature) {
			selectedFeature = feature;
			// Get the original style
			let originalStyle = feature.getStyle ? feature.getStyle() : null;
			// If the style is a plain object (from JSON), convert it
			if (originalStyle && !(originalStyle instanceof ol.style.Style)) {
				// If it's an array, convert each element
				if (Array.isArray(originalStyle)) {
					originalStyle = originalStyle.map(s => (s instanceof ol.style.Style) ? s : new ol.style.Style(s));
				} else {
					originalStyle = new ol.style.Style(originalStyle);
				}
			}
			if (feature && typeof feature.setStyle === 'function') {
				feature.setStyle(originalStyle);
			}
			$('#map').css('cursor', 'pointer');
			return true;
		});
	});

	map.on('singleclick', function (evt) {
		var coordinate = evt.coordinate,
				coordinateLL = ol.proj.toLonLat(coordinate),
				coordinateText = ol.coordinate.format(coordinateLL, '[{y}, {x}]', 5);
		console.log('pinMap', coordinateText);
		var pinMap = new ol.Overlay({
			element: $('<div>').addClass('osmcat-map-pin').attr('title', coordinateText).html('<i class="fa fa-map-pin"></i>')[0],
			position: coordinate
			//positioning: 'bottom-center' //BUG center no funciona correctament en la v6.1.1 -> FIX setPositioning
		});
		map.addOverlay(pinMap);
		pinMap.setPositioning('bottom-center'); //FIX bug al centrar l'element

		var popupContingut = config.onClickEvent.call(this, evt, view, coordinateLL);

		var nodeInfo = $('<div>');
		var numFeatures = 0;
		map.forEachFeatureAtPixel(evt.pixel, function (feature) {
			numFeatures++;
			nodeInfo.append(config.forFeatureAtPixel.call(this, evt, feature));
		});

		var popupContingutExtra = config.onClickEventExtra.call(this, evt, view, coordinateLL, numFeatures);

		$('<div>').html([popupContingut, nodeInfo, popupContingutExtra]).dialog({
			title: coordinateText,
			position: {my: 'left top', at: 'left bottom', of: $(pinMap.getElement())},
			close: function () {
				$(this).dialog('destroy');
				map.removeOverlay(pinMap);
			},
			focus: function () {
				$(pinMap.getElement()).animate({color: '#F00', paddingBottom: 5}, 200).animate({color: '#000', paddingBottom: 0}, 200).animate({color: '#F00', paddingBottom: 5}, 200).animate({color: '#000', paddingBottom: 0}, 200).animate({color: '#F00', paddingBottom: 5}, 200).animate({color: '#000', paddingBottom: 0}, 200);
			}
		});

	});
});

// Listen for overlay toggles and update summary
window.addEventListener('overlayToggled', function(e) {
    // Count all visible overlay features
    var total = 0;
    var overlaysActive = 0;
    (window.config.layers || []).forEach(function(layerGroup) {
        if (layerGroup.get && layerGroup.get('type') === 'overlay') {
            layerGroup.getLayers().getArray().forEach(function(layer) {
                if (layer.getVisible() && layer.getSource && typeof layer.getSource === 'function') {
                    var source = layer.getSource();
                    if (source && typeof source.getFeatures === 'function') {
                        var allFeatures = source.getFeatures();

                        // Count only tagged features
                        var taggedFeatures = allFeatures.filter(function(feature) {
                            var properties = feature.getProperties();
                            var basicProperties = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry'];
                            return Object.keys(properties).some(function(prop) {
                                return !basicProperties.includes(prop);
                            });
                        });

                        var count = taggedFeatures.length;
                        if (count > 0) overlaysActive++;
                        total += count;
                    }
                }
            });
        }
    });
    if (overlaysActive > 0) {
        window.setOverlaySummary(overlaysActive + ' overlay' + (overlaysActive > 1 ? 's' : '') + ', ' + total + ' tagged feature' + (total !== 1 ? 's' : ''));
    } else {
        window.setOverlaySummary('');
    }
});

// New summary update function
function updateOverlaySummary() {
    var total = 0;
    var overlaysActive = 0;
    (window.config.layers || []).forEach(function(layerGroup) {
        if (layerGroup.get && layerGroup.get('type') === 'overlay') {
            layerGroup.getLayers().getArray().forEach(function(layer) {
                if (layer.getVisible() && layer.getSource && typeof layer.getSource === 'function') {
                    var source = layer.getSource();
                    if (source && typeof source.getFeatures === 'function') {
                        var allFeatures = source.getFeatures();

                        // Count only tagged features (features with properties beyond basic OSM properties)
                        var taggedFeatures = allFeatures.filter(function(feature) {
                            var properties = feature.getProperties();
                            var basicProperties = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry'];
                            return Object.keys(properties).some(function(prop) {
                                return !basicProperties.includes(prop);
                            });
                        });

                        var count = taggedFeatures.length;
                        if (count > 0) overlaysActive++;
                        total += count;
                    }
                }
            });
        }
    });
    if (overlaysActive > 0) {
        window.setOverlaySummary(overlaysActive + ' overlay' + (overlaysActive > 1 ? 's' : '') + ', ' + total + ' tagged feature' + (total !== 1 ? 's' : ''));
    } else {
        window.setOverlaySummary('');
    }
}

// Trigger summary update on relevant events
window.addEventListener('overlayToggled', updateOverlaySummary);
window.addEventListener('overlaysReady', function() {
    setTimeout(updateOverlaySummary, 1500);
});
window.addEventListener('overlaysFullyLoaded', function() {
    setTimeout(updateOverlaySummary, 1500);
});
$(function() {
    setTimeout(updateOverlaySummary, 1000);
});

// Overlay summary management
function setOverlaySummary(summary) {
    console.log('📊 Overlay summary:', summary);

    // Update any UI element that displays overlay summary
    const summaryElement = document.getElementById('overlay-summary') ||
                          document.querySelector('.overlay-summary') ||
                          document.querySelector('#overlay-count');

    if (summaryElement) {
        summaryElement.textContent = summary;
    }
}

// Make it available globally
window.setOverlaySummary = setOverlaySummary;

function updatePermalink() {
    console.log('🔗 updatePermalink called - START');

    // Get current tag queries from the legend (with safety check)
    const tagQueries = window.tagQueryLegend ? window.tagQueryLegend.getVisibleQueries() : [];
    console.log('🔗 Legend queries:', tagQueries);

    // Check map layers for tag queries as primary method
    if (window.map) {
        console.log('🔗 Scanning map layers for tag queries');
        const allTagQueryLayers = [];

        // Recursively search through all layers (including layer groups)
        function findTagQueryLayers(layers) {
            layers.forEach(layer => {
                console.log('🔗 Checking layer:', layer.get ? layer.get('id') : 'no id', layer.get ? layer.get('title') : 'no title');

                // Check if this layer is a tag query layer
                if (layer.get && layer.get('id') && layer.get('id').startsWith('tag_')) {
                    const layerId = layer.get('id');
                    const title = layer.get('title') || '';
                    console.log(`🔗 Found tag layer: ${layerId} with title: ${title}`);

                    // Parse key=value from title, ignoring count information
                    const match = title.match(/^([^=]+)=([^(\s]+)\s*(\([^)]*\))?$/);
                    if (match) {
                        const key = match[1];
                        const value = match[2];
                        allTagQueryLayers.push({
                            key: key,
                            value: value,
                            overlayId: layerId
                        });
                        console.log(`🔗 Parsed tag query: ${key}:${value}`);
                    } else {
                        console.log(`🔗 Could not parse title: ${title}`);
                    }
                }

                // If this layer is a group, recursively search its layers
                if (layer.getLayers && typeof layer.getLayers === 'function') {
                    const subLayers = layer.getLayers().getArray();
                    console.log(`🔗 Layer group found with ${subLayers.length} sublayers`);
                    if (subLayers.length > 0) {
                        findTagQueryLayers(subLayers);
                    }
                }
            });
        }

        const mapLayers = window.map.getLayers().getArray();
        console.log(`🔗 Starting recursive search with ${mapLayers.length} top-level layers`);
        findTagQueryLayers(mapLayers);

        console.log('🔗 Total tag query layers found:', allTagQueryLayers);

        // Use found layers as tag queries
        if (allTagQueryLayers.length > 0) {
            tagQueries.push(...allTagQueryLayers);
            console.log('🔗 Using map layer queries:', tagQueries);
        }
    }

    console.log('🔗 Final tag queries to add to URL:', tagQueries);

    // Build URL parameters
    const params = new URLSearchParams();

    // Add tag queries to URL
    tagQueries.forEach((query, index) => {
        console.log('🔗 Adding tag to URL:', query.key, query.value);
        params.append('tag', `${query.key}:${query.value}`);
    });

    // Add current map view parameters if available
    if (window.map && window.map.getView()) {
        const view = window.map.getView();
        const center = ol.proj.toLonLat(view.getCenter());
        const zoom = view.getZoom();

        params.append('lat', center[1].toFixed(6));
        params.append('lon', center[0].toFixed(6));
        params.append('zoom', Math.round(zoom));
    }

    // Preserve language parameter if present
    const currentUrl = new URL(window.location.href);
    const currentLang = currentUrl.searchParams.get('lang');
    if (currentLang) {
        params.append('lang', currentLang);
    }

    // Update URL without triggering page reload
    const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}${window.location.hash}`;
    console.log('🔗 New URL:', newUrl);
    window.history.replaceState({}, '', newUrl);

    console.log('🔗 URL updated successfully');
}

window.updatePermalink = updatePermalink;

// Set up event listeners for tag query URL updates
function setupTagQueryEventListeners() {
    console.log('🔗 Setting up tag query event listeners');

    // Test event dispatching
    console.log('🔗 Testing event listener setup');
    window.dispatchEvent(new CustomEvent('tagQueryTest', { detail: { test: true } }));

    // Listen for tag query events and update URL
    window.addEventListener('tagQueryAdded', function(event) {
        console.log('🔗 Tag query added event:', event.detail);
        console.log('🔗 tagQueryLegend exists:', !!window.tagQueryLegend);
        console.log('🔗 tagQueryLegend queries:', window.tagQueryLegend ? window.tagQueryLegend.queries.size : 'N/A');
        updatePermalink();
    });

    window.addEventListener('tagQueryRemoved', function(event) {
        console.log('🔗 Tag query removed event:', event.detail);
        updatePermalink();
    });

    window.addEventListener('tagQueryVisibilityChanged', function(event) {
        console.log('🔗 Tag query visibility changed event:', event.detail);
        updatePermalink();
    });

    window.addEventListener('tagQueryCountUpdated', function(event) {
        console.log('🔗 Tag query count updated event:', event.detail);
        updatePermalink();
    });

    // Test listener
    window.addEventListener('tagQueryTest', function(event) {
        console.log('🔗 Test event received:', event.detail);
    });
}

// Initialize tag query URL event listeners immediately
setupTagQueryEventListeners();

// Initialize tag query URL event listeners when the page loads (backup)
$(document).ready(function() {
    setTimeout(setupTagQueryEventListeners, 1000);
});

function linearColorInterpolation(colorFrom, colorTo, weight) {
    var p = weight < 0 ? 0 : (weight > 1 ? 1 : weight),
        w = p * 2 - 1,
        w1 = (w/1+1) / 2,
        w2 = 1 - w1,
        rgb = [Math.round(colorTo[0] * w1 + colorFrom[0] * w2), Math.round(colorTo[1] * w1 + colorFrom[1] * w2), Math.round(colorTo[2] * w1 + colorFrom[2] * w2)];
    return rgb;
}
