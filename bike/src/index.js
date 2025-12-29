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
        if (!window.allOverlays || typeof window.allOverlays !== 'object') {
            console.warn('window.allOverlays is not a valid object');
            window.overlays = [];
            return;
        }
        
        try {
            window.overlays = Object.entries(window.allOverlays).reduce((acc, [groupName, overlayGroup]) => {
                if (Array.isArray(overlayGroup)) {
                    const mappedOverlays = overlayGroup.map(overlay => ({
                        // Use already translated values
                        title: overlay && typeof overlay.title !== 'undefined' ? overlay.title : '',
                        group: overlay && overlay.group ? overlay.group : groupName,
                        id: overlay && overlay.id ? overlay.id : '',
                        ...(overlay || {})
                    }));
                    return acc.concat(mappedOverlays);
                }
                return acc;
            }, []);
        } catch (error) {
            console.error('Error in updateWindowOverlays:', error);
            window.overlays = [];
        }
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
			console.log('🔄 Loader shown, count:', this.count);
		},
		hide: function () {
			--this.count;
			if (this.count < 1) {
				this.spinner.hide();
				this.count = 0;
				console.log('🔄 Loader hidden, count reset to 0');
			} else {
				console.log('🔄 Loader hide requested, but count is still:', this.count);
			}
		},
		forceHide: function() {
			console.log('🔄 Force hiding loader regardless of count');
			this.spinner.hide();
			this.count = 0;
		},
		getStatus: function() {
			return {
				visible: this.spinner.is(':visible'),
				count: this.count
			};
		}
	};
	// Export loading to global scope for other modules
	window.loading = loading;

	// Add global loader management to prevent stuck loaders
	setInterval(function() {
		if (window.loading && window.loading.getStatus().visible) {
			console.log('🔄 Loader status check - visible:', window.loading.getStatus());
		}
	}, 30000); // Check every 30 seconds

	// Add global error handler to catch any uncaught errors that might prevent loader hiding
	window.addEventListener('error', function(event) {
		console.error('🚨 Global error caught:', event.error);
		if (window.loading && window.loading.getStatus().visible) {
			console.log('🔄 Hiding loader due to global error');
			window.loading.forceHide();
		}
	});

	// Add unhandled rejection handler
	window.addEventListener('unhandledrejection', function(event) {
		console.error('🚨 Unhandled rejection caught:', event.reason);
		if (window.loading && window.loading.getStatus().visible) {
			console.log('🔄 Hiding loader due to unhandled rejection');
			window.loading.forceHide();
		}
	});

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
			format: new ol.format.OSMXML(),
			loader: function (extent, resolution, projection) {
				loading.show();
				var me = this;
				var epsg4326Extent = ol.proj.transformExtent(extent, projection, 'EPSG:4326');
				var query = '[out:xml][timeout:25];' + overlay['query']; // Added timeout parameter
				query = query.replace(/{{bbox}}/g, epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' + epsg4326Extent[3] + ',' + epsg4326Extent[2]);

				var client = new XMLHttpRequest();
				client.open('POST', config.overpassApi());
				client.onloadend = function () {
					loading.hide();
				};
				client.onerror = function () {
					console.error('[' + (client.status || 'unknown') + '] Error loading data.');
					me.removeLoadedExtent(extent);
					if (vector) vector.setVisible(false);
				};
				client.onload = function () {
					if (client.status === 200) {
						try {
							var parser = new DOMParser();
							var xmlDoc = parser.parseFromString(client.responseText, 'text/xml');
							var remark = xmlDoc.getElementsByTagName('remark');
							var nodes = xmlDoc.getElementsByTagName('node');
							var nodosLength = nodes ? nodes.length : 0;
						} catch (e) {
							console.error('Error parsing OSM XML response:', e);
							me.removeLoadedExtent(extent);
							if (vector) vector.setVisible(false);
							return;
						}

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
							var features = new ol.format.OSMXML().readFeatures(xmlDoc, {
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

	// Parse both query string and hash parameters
	var urlParams = new URLSearchParams(window.location.search);
	var hashParams = {};
	if (window.location.hash !== '') {
		window.location.hash.replace(/[#?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
			hashParams[key] = decodeURIComponent(value);
		});
	}

	// Merge hash params into vars (for backward compatibility)
	vars = Object.assign(vars, hashParams);

	// Handle map parameters from hash
	var mapParam = hashParams['map'] || '', parts;
	if (mapParam !== '') {
		parts = mapParam.split('/');
		config.initialConfig.zoom = parseFloat(parts[0]);
		config.initialConfig.lat = parseFloat(parts[1]);
		config.initialConfig.lon = parseFloat(parts[2]);
		if (typeof parts[3] !== 'undefined') {
			config.initialConfig.rotation = parseFloat(parts[3]);
		}
	}

	// Handle parameters from query string (higher priority than hash)
	var lat = urlParams.get('lat');
	var lon = urlParams.get('lon');
	var zoom = urlParams.get('zoom');
	var baseParam = urlParams.get('base');
	var lang = urlParams.get('lang');
	var key = urlParams.get('key');
	var value = urlParams.get('value');

	if (lat !== null) config.initialConfig.lat = parseFloat(lat);
	if (lon !== null) config.initialConfig.lon = parseFloat(lon);
	if (zoom !== null) config.initialConfig.zoom = parseFloat(zoom);
	if (baseParam !== null) baseParam = parseInt(baseParam, 10);

	// Handle tag queries from both query string and hash
	var tagQueryParams = [];

	// Handle key=value from query string
	if (key && value) {
		tagQueryParams.push({key: key, value: value});
	}

	// Handle tag parameters from query string
	urlParams.forEach(function(value, key) {
		if (key === 'tag') {
			// Handle tag=key:value[nwr] format
			var colonIndex = value.indexOf(':');
			if (colonIndex !== -1) {
				var tagKey = value.substring(0, colonIndex);
				var bracketIndex = value.indexOf('[', colonIndex);
				var tagValue;
				var urlElementTypes = null;
				if (bracketIndex !== -1) {
					// Extract value before bracket
					tagValue = value.substring(colonIndex + 1, bracketIndex);
					// Extract element types from brackets
					var elementTypesStr = value.substring(bracketIndex + 1, value.indexOf(']', bracketIndex));
					console.log('🔗 Element types from URL:', elementTypesStr, 'for tag:', tagKey, '=', tagValue);

					// Convert element type acronyms to full names
					urlElementTypes = [];
					for (var i = 0; i < elementTypesStr.length; i++) {
						switch(elementTypesStr[i]) {
							case 'n': urlElementTypes.push('node'); break;
							case 'w': urlElementTypes.push('way'); break;
							case 'r': urlElementTypes.push('relation'); break;
						}
					}
				} else {
					// Legacy format without brackets - assume all element types
					tagValue = value.substring(colonIndex + 1);
					urlElementTypes = ['node', 'way', 'relation'];
				}
				tagQueryParams.push({key: tagKey, value: tagValue, elementTypes: urlElementTypes});

				// Set checkboxes based on URL element types
				if (urlElementTypes && urlElementTypes.length > 0) {
					// Uncheck all checkboxes first
					$('.element-type-checkbox').prop('checked', false);

					// Check the appropriate checkboxes based on URL element types
					urlElementTypes.forEach(function(type) {
						$(`.element-type-checkbox[value="${type}"]`).prop('checked', true);
					});

					console.log('🔗 Set checkboxes based on URL element types:', urlElementTypes);
				}
			}
		}
	});

	// Handle tag parameters from hash (legacy support)
	Object.keys(hashParams).forEach(function(key) {
		if (key.startsWith('tag.') || (key === 'tag' && hashParams[key].includes('='))) {
			if (key.startsWith('tag.')) {
				const tagKey = key.substring(4); // Remove 'tag.' prefix
				tagQueryParams.push({key: tagKey, value: hashParams[key]});
			} else if (key === 'tag') {
				// Handle tag=key=value format
				const tagParts = hashParams[key].split('=');
				if (tagParts.length === 2) {
					tagQueryParams.push({key: tagParts[0], value: tagParts[1]});
				}
			}
		}
	});

	// Set base layer visibility
	$.each(config.layers, function(indexLayer, layer) {
		if (layer.get('type') === 'overlay') {
			// overlays
			var overlayParam = hashParams[layer.get('title')] || '';
			$.each(layer.getLayers().getArray(), function (overlayIndex, overlayValue) {
				overlayValue.setVisible(!!parseInt(overlayParam.charAt(overlayIndex)));
			});
		} else {
			// base layers
			if (baseParam !== null && indexLayer === baseParam) {
				layer.setVisible(true);
			} else if (baseParam === null && indexLayer === 0) {
				// Default to first layer if no base specified
				layer.setVisible(true);
			} else if (baseParam !== null) {
				layer.setVisible(false);
			}
		}
	});

	// Store tag queries for later execution
	if (tagQueryParams.length > 0) {
		window.initialTagQueries = tagQueryParams;
	}

	// Set language if specified
	if (lang) {
		// Store for later use when i18n is ready
		window.urlLanguage = lang;
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

	// Wait for translations to be initialized before initializing Taginfo API
	const waitForTranslationsThenInitTaginfo = () => {
		try {
			const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'ca';
			console.log('🔍 Initializing Taginfo API for language:', currentLang);

			// Check if i18n is fully initialized
			if (typeof window.getTranslation === 'function' && window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
				console.log('🔍 Translations and i18n available, initializing Taginfo API');

				// Initialize Taginfo API now that i18n is ready
				initTaginfoAPI().then(() => {
					console.log('✅ Taginfo API initialized successfully');

					try {
						// Initialize search modules after taginfo is ready
						initKeySearch();
						initValueSearch();

						// Enable automatic execution of tag queries from URL
						if (window.initialTagQueries && window.initialTagQueries.length > 0) {
							console.log('🔍 Tag queries from URL found, executing automatically:', window.initialTagQueries);

							// Execute tag queries from URL
							window.initialTagQueries.forEach(function(query) {
								console.log('🔍 Executing tag query from URL:', query);
								if (window.executeTagQuery && typeof window.executeTagQuery === 'function') {
									window.executeTagQuery(query.key, query.value);
								}
							});

							// Clear the initial queries after execution
							window.initialTagQueries = [];
						}

						// Set up event listeners for tag query URL updates
						setupTagQueryEventListeners();
					} catch (initError) {
						console.error('❌ Error initializing search modules:', initError);
					}
				}).catch(error => {
					console.error('❌ Failed to initialize Taginfo API:', error);
					// Try to continue with the rest of the app even if Taginfo fails
					try {
						initKeySearch();
						initValueSearch();
						setupTagQueryEventListeners();
					} catch (fallbackError) {
						console.error('❌ Fallback initialization also failed:', fallbackError);
					}
				});
			} else {
				console.warn('⚠️ i18n not fully initialized, but attempting to load Taginfo API anyway');
				
				// Try to initialize anyway with a fallback
				try {
					initTaginfoAPI()
						.then(() => {
							console.log('✅ Taginfo API initialized without i18n');
							initKeySearch();
							initValueSearch();
							setupTagQueryEventListeners();
						})
						.catch(error => {
							console.error('❌ Failed to initialize Taginfo API without i18n:', error);
							// Still try to initialize search modules
							try {
								initKeySearch();
								initValueSearch();
								setupTagQueryEventListeners();
							} catch (e) {
								console.error('❌ Failed to initialize search modules:', e);
							}
						});
				} catch (e) {
					console.error('❌ Error during Taginfo API initialization attempt:', e);
				}
			}
		} catch (e) {
			console.error('❌ Error in waitForTranslationsThenInitTaginfo:', e);
			// Last resort: try to initialize search modules even if everything else failed
			try {
				initKeySearch();
				initValueSearch();
				setupTagQueryEventListeners();
			} catch (finalError) {
				console.error('❌ Final fallback initialization failed:', finalError);
			}
		}
	};

	waitForTranslationsThenInitTaginfo();

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
						// Hide all base layers first
						config.layers.forEach(function(l) {
							if (l.get('type') === 'base') {
								l.setVisible(false);
							}
						});

						// Show the clicked layer
						layer.setVisible(true);
						
						// Update the visible layer reference
						visibleLayer = layer;
						baseLayerIndex = layer.get('layerIndex');
						
						// Update the permalink
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
				console.log('🧹 Clear overlay button clicked');

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
					console.log('🧹 Calling clearMapLayers from clear overlay button');
					window.clearMapLayers();
				} else {
					console.log('🧹 clearMapLayers function not found');
				}

				// Overlay list is disabled - no need to update it
				$('#overlay-search').val('');
				if (window.updateOverlaySummary) window.updateOverlaySummary();

				alert('Clear completed - check console for details');
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
			window.location.href = 'https://github.com/osm-es/portalmap';
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


	// Rotate right button
var rotaterightControlBuild = function () {
    var container = $('<div>').addClass('ol-control ol-unselectable ol-rotate-right').html($('<button type="button" title="Rotate right"><i class="fa fa-undo fa-flip-horizontal"></i></button>').on('click', function () {
        var currentRotation = view.getRotation();
        if (currentRotation < 6.1) { //360º = 2 Pi r =aprox 6.2
            view.setRotation(round(currentRotation + 0.1, 2));
        } else {
            view.setRotation(0);
        }
    }));
    return container[0];
};

// Rotate left button
var rotateleftControlBuild = function () {
    var container = $('<div>').addClass('ol-control ol-unselectable ol-rotate-left').html($('<button type="button" title="Rotate left"><i class="fa fa-undo"></i></button>').on('click', function () {
        var currentRotation = view.getRotation();
        if (currentRotation > -6.1) { //360º = 2 Pi r =aprox 6.2
            view.setRotation(round(currentRotation - 0.1, 2));
        } else {
            view.setRotation(0);
        }
    }));
    return container[0];
};

// 3D Toggle button
function toggle3DControlBuild() {
    // Check if ol-cesium is available
    if (typeof olcs === 'undefined') {
        console.error('ol-cesium library not loaded. 3D view is not available.');
        const button = document.createElement('button');
        button.innerHTML = '<i class="fa fa-cube" style="color: #ccc;"></i>';
        button.title = '3D view not available - ol-cesium library not loaded';
        button.disabled = true;
        button.style.cursor = 'not-allowed';
        
        const element = document.createElement('div');
        element.className = 'ol-unselectable ol-control ol-3d-toggle';
        element.appendChild(button);
        return element;
    }
    
    const button = document.createElement('button');
    button.innerHTML = '<i class="fa fa-cube"></i>';
    button.title = 'Toggle 3D View';
    
    const element = document.createElement('div');
    element.className = 'ol-unselectable ol-control ol-3d-toggle';
    element.appendChild(button);

    let ol3d = null;
    let is3d = false;
    let cesiumInitialized = false;

    // Store the click handler reference for the return-to-2D button
    const clickHandler = async function() {
        try {
            // Check if Cesium is available
            if (typeof Cesium === 'undefined') {
                console.error('Cesium library not loaded. 3D view is not available.');
                alert('Cesium library not loaded. Please refresh the page and try again.');
                return;
            }
            
console.log('3D toggle clicked, current is3d state:', is3d);
if (!is3d) {
    // Initialize Cesium if not already done
    let routeLayers = []; // Move declaration to higher scope
    if (!cesiumInitialized) {
        try {
            // Check for and handle active route layers that might cause conflicts
            routeLayers = [];
map.getLayers().forEach(layer => {
    if (layer.get && layer.get('type') === 'route' || 
        (layer instanceof ol.layer.Vector && layer.getSource && 
         layer.getSource().getFeatures && 
         layer.getSource().getFeatures().length > 0)) {
        routeLayers.push(layer);
    }
});
if (routeLayers.length > 0) {
    console.log('Detected route layers, temporarily hiding for 3D initialization');
    routeLayers.forEach(layer => layer.setVisible(false));
}
                        
                        // Initialize OLCesium with minimal configuration
                        // Wait a bit to ensure map is fully initialized before creating ol3d
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Completely remove all overlays from map to prevent SynchronizedOverlay issues
                        const overlaysToRestore = [];
                        const currentOverlays = map.getOverlays().getArray();
                        
                        // Remove all overlays from map
                        while (currentOverlays.length > 0) {
                            const overlay = currentOverlays[0];
                            if (overlay) {
                                overlaysToRestore.push(overlay);
                                map.removeOverlay(overlay);
                            }
                        }
                        
                        // Clear the overlay collection completely
                        map.getOverlays().clear();
                        
                        ol3d = new olcs.OLCesium({
                            map: map,
                            target: 'map',
                            createSvg: false, // Disable SVG creation which can cause issues
                            useDefaultRenderLoop: false, // Disable default render loop to prevent overlay sync issues
                            time: function() { return Cesium.JulianDate.now(); }
                        });
                        
                        // Store overlays for restoration after full 3D initialization
                        window.overlaysToRestore = overlaysToRestore;
                        
                        // Store the ol3d instance globally for fallback access
                        window.ol3d = ol3d;
                        
                        const scene = ol3d.getCesiumScene();
                        
                        // Configure scene
                        scene.globe.enableLighting = true;
                        scene.globe.depthTestAgainstTerrain = false; // Disable terrain depth test for better performance
                       
                        // Restore any route layers that were hidden for initialization
if (routeLayers.length > 0) {
    console.log('Restoring route layers after 3D initialization');
    routeLayers.forEach(layer => layer.setVisible(true));
}

                        // Set up terrain provider
                        try {
                            scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
                        } catch (error) {
                            console.warn('Failed to set terrain provider, using default:', error);
                            // Continue without custom terrain provider
                        }
                        
                        // Clear any existing imagery layers
                        scene.imageryLayers.removeAll();
                        
                        // Get the currently visible base layer from the 2D map
                        let currentBaseLayer = null;
                        let imageryProvider = null;
                        
                        // Find the currently visible base layer
                        config.layers.forEach(layer => {
                            if (layer.get && layer.get('type') !== 'overlay' && layer.getVisible && layer.getVisible()) {
                                currentBaseLayer = layer;
                            }
                        });
                        
                        // Choose appropriate imagery provider based on the current base layer
                        if (currentBaseLayer) {
                            const layerTitle = currentBaseLayer.get('title') || '';
                            console.log('Current base layer:', layerTitle);
                            
                            // Map different base layers to appropriate Cesium providers
                            if (layerTitle.includes('MapTiler') || layerTitle.includes('Basic')) {
                                // Use a reliable satellite provider instead of MapTiler to avoid API key issues
                                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                                    tileWidth: 256,
                                    tileHeight: 256,
                                    minimumLevel: 0,
                                    maximumLevel: 18
                                });
                            } else if (layerTitle.includes('OpenStreetMap') || layerTitle.includes('OSM')) {
                                // Use OSM tiles
                                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                    subdomains: ['a', 'b', 'c'],
                                    tileWidth: 256,
                                    tileHeight: 256,
                                    minimumLevel: 0,
                                    maximumLevel: 19
                                });
                            } else if (layerTitle.includes('Satellite') || layerTitle.includes('Aerial')) {
                                // Use a satellite provider
                                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                                    tileWidth: 256,
                                    tileHeight: 256,
                                    minimumLevel: 0,
                                    maximumLevel: 18
                                });
                            } else {
                                // Default fallback to OSM
                                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                    subdomains: ['a', 'b', 'c'],
                                    tileWidth: 256,
                                    tileHeight: 256,
                                    minimumLevel: 0,
                                    maximumLevel: 19
                                });
                            }
                        } else {
                            // No base layer found, use default OSM
                            console.log('No base layer found, using default OSM');
                            imageryProvider = new Cesium.UrlTemplateImageryProvider({
                                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                subdomains: ['a', 'b', 'c'],
                                tileWidth: 256,
                                tileHeight: 256,
                                minimumLevel: 0,
                                maximumLevel: 19
                            });
                        }
                        
                        // Add the selected imagery provider
                        try {
                            scene.imageryLayers.addImageryProvider(imageryProvider);
                            console.log('Successfully added imagery provider for 3D view');
                            
                            // Add error handling for tile loading errors (only if errorEvent exists)
                            if (imageryProvider.errorEvent && imageryProvider.errorEvent.addEventListener) {
                                imageryProvider.errorEvent.addEventListener(function(error) {
                                    console.warn('Imagery provider tile loading error:', error);
                                    // Silently handle tile errors to prevent console spam
                                });
                            }
                            
                        } catch (error) {
                            console.error('Error adding imagery provider, using fallback:', error);
                            // Fallback to simple OSM provider
                            const fallbackProvider = new Cesium.UrlTemplateImageryProvider({
                                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                subdomains: ['a', 'b', 'c'],
                                tileWidth: 256,
                                tileHeight: 256,
                                minimumLevel: 0,
                                maximumLevel: 19
                            });
                            
                            // Add error handling to fallback provider as well (only if errorEvent exists)
                            if (fallbackProvider.errorEvent && fallbackProvider.errorEvent.addEventListener) {
                                fallbackProvider.errorEvent.addEventListener(function(error) {
                                    console.warn('Fallback imagery provider tile loading error:', error);
                                });
                            }
                            
                            scene.imageryLayers.addImageryProvider(fallbackProvider);
                        }
                        
                        // Disable Cesium ion features that require authentication
                        Cesium.Ion.defaultAccessToken = null;
                        
                        // Add global error handling for tile loading issues (only if events exist)
                        if (scene.globe && scene.globe.tileLoadProgressEvent && scene.globe.tileLoadProgressEvent.addEventListener) {
                            scene.globe.tileLoadProgressEvent.addEventListener(function(queued, processing, ready) {
                                // Optionally log tile loading progress
                                if (processing > 0) {
                                    // Tiles are loading
                                }
                            });
                        }
                        
                        // Suppress tile loading errors globally (only if events exist)
                        if (scene.imageryLayers && scene.imageryLayers.collectionChanged && scene.imageryLayers.collectionChanged.addEventListener) {
                            scene.imageryLayers.collectionChanged.addEventListener(function() {
                                // Handle imagery layer changes
                            });
                        }
                        
                        // Set a default view with a reasonable height
                        const view = map.getView();
                        const center = ol.proj.toLonLat(view.getCenter());
                        const zoom = view.getZoom();
                        
                        // Convert OpenLayers zoom to Cesium height
                        const height = 10000000 / Math.pow(1.5, zoom);
                        
                        // Set initial camera position
                        scene.camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(
                                center[0],
                                center[1],
                                Math.max(height, 1000) // Ensure minimum height
                            ),
                            orientation: {
                                heading: 0.0,
                                pitch: -Cesium.Math.PI_OVER_TWO,
                                roll: 0.0
                            }
                        });
                        
                        cesiumInitialized = true;
                    } catch (error) {
                        console.error('Error initializing 3D view:', error);
                        alert('Error initializing 3D view. Please check console for details.');
                        return;
                    }
                }
                
                // Wait before enabling Cesium to allow complete initialization
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Temporarily disable overlay synchronizer to prevent SynchronizedOverlay errors
                const overlaySynchronizer = ol3d.overlaySynchronizer;
                if (overlaySynchronizer && overlaySynchronizer.synchronizeOverlays) {
                    const originalSync = overlaySynchronizer.synchronizeOverlays;
                    overlaySynchronizer.synchronizeOverlays = function() {
                        // Skip synchronization during initialization
                        console.log('Skipping overlay synchronization during 3D initialization');
                    };
                    
                    // Restore original synchronization after a delay
                    setTimeout(() => {
                        overlaySynchronizer.synchronizeOverlays = originalSync;
                        console.log('Restored overlay synchronization');
                    }, 3000);
                }
                
                // Enable Cesium
                ol3d.setEnabled(true);
                
                // Wait for Cesium to initialize
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const scene = ol3d.getCesiumScene();
                
                // Force a frame to be rendered
                scene.initializeFrame();
                scene.render();
                
                // Start manual render loop since default is disabled
                const renderLoop = function() {
                    if (ol3d && ol3d.getEnabled()) {
                        scene.initializeFrame();
                        scene.render();
                        requestAnimationFrame(renderLoop);
                    }
                };
                requestAnimationFrame(renderLoop);
                
                // IMPORTANT: Skip layer synchronization during 3D initialization to prevent SynchronizedOverlay errors
                // Layer synchronization will happen naturally when ol-cesium is ready
                console.log('Skipping manual layer synchronization to prevent overlay conflicts during 3D initialization');
                
                // Restore any route layers that were hidden for initialization
                if (routeLayers.length > 0) {
                    console.log('Restoring route layers after 3D initialization');
                    routeLayers.forEach(layer => layer.setVisible(true));
                }
                
                // Skip overlay restoration in 3D mode to prevent SynchronizedOverlay errors
                // Overlays will be restored when switching back to 2D mode
                if (window.overlaysToRestore && window.overlaysToRestore.length > 0) {
                    console.log(`Skipping overlay restoration in 3D mode (${window.overlaysToRestore.length} overlays will be restored in 2D mode)`);
                    // Store overlays for 2D restoration
                    window.overlaysFor2D = window.overlaysToRestore;
                    window.overlaysToRestore = null;
                }
                
                // Add event listener to refresh 3D imagery when queries are added
                window.addEventListener('tagQueryAdded', function() {
                    if (window.ol3d && window.ol3d.getEnabled()) {
                        console.log('Tag query added in 3D mode, refreshing imagery layers');
                        refresh3DImagery();
                    }
                });
                
                console.log('3D mode enabled with synchronized layers');
                
                // Show return to 2D button
                showReturnTo2DButton();
                
                // Show 3D background selector
                show3DBackgroundSelector();
                
                // Sync camera
                const view = map.getView();
                const center = ol.proj.toLonLat(view.getCenter());
                const zoom = view.getZoom();
                const height = 10000000 / Math.pow(1.5, zoom);
                
                scene.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(
                        center[0],
                        center[1],
                        Math.max(height, 1000)
                    ),
                    orientation: {
                        heading: 0.0,
                        pitch: -Cesium.Math.PI_OVER_TWO,
                        roll: 0.0
                    }
                });
                
                button.innerHTML = '<i class="fa fa-map"></i>';
                button.title = 'Switch to 2D';
                
                // IMPORTANT: Update the is3d state to true
                is3d = true;
                console.log('Updated is3d state to true');
            } else {
                console.log('Switching from 3D to 2D mode');
                
                // Store current view before disabling 3D
                const scene = ol3d.getCesiumScene();
                const camera = scene.camera;
                const position = Cesium.Cartographic.fromCartesian(camera.position);
                
                // Disable Cesium
                ol3d.setEnabled(false);
                
                // IMPORTANT: Update the is3d state to false
                is3d = false;
                console.log('Updated is3d state to false');
                
                // Comprehensive cleanup of ol-cesium to prevent SynchronizedOverlay errors
                if (window.ol3d) {
                    try {
                        // Force complete cleanup of ol-cesium
                        if (window.ol3d.overlaySynchronizer) {
                            // Disable overlay synchronizer completely
                            window.ol3d.overlaySynchronizer.dispose();
                            console.log('Disposed overlay synchronizer');
                        }
                        
                        // Clear any remaining references
                        window.ol3d = null;
                        console.log('Cleared ol3d reference');
                    } catch (cleanupError) {
                        console.warn('Error during ol-cesium cleanup:', cleanupError);
                    }
                }
                
                // Refined global patch to prevent SynchronizedOverlay creation without interfering with UI
                // TODO: Add fundamental overlay synchronizer disable here
                if (!window.synchronizedOverlayPatched) {
                    window.synchronizedOverlayPatched = true;

                    // Patch map.addOverlay to prevent SynchronizedOverlay interference
                    const originalAddOverlay = map.addOverlay.bind(map);
                    map.addOverlay = function(overlay) {
                        try {
                            // Only apply patch if we're in 2D mode and ol3d still exists
                            if (!is3d && window.ol3d) {
                                console.warn('ol3d still exists in 2D mode, applying minimal patch');
                                try {
                                    // Only disable overlay synchronizer, don't force full cleanup
                                    if (window.ol3d.overlaySynchronizer) {
                                        const originalSync = window.ol3d.overlaySynchronizer.synchronizeOverlays;
                                        window.ol3d.overlaySynchronizer.synchronizeOverlays = function() {
                                            // Skip synchronization in 2D mode
                                        };

                                        // Restore synchronization after a short delay
                                        setTimeout(() => {
                                            if (window.ol3d && window.ol3d.overlaySynchronizer && originalSync) {
                                                window.ol3d.overlaySynchronizer.synchronizeOverlays = originalSync;
                                            }
                                        }, 100);
                                    }
                                } catch (patchError) {
                                    console.warn('Error during overlay synchronizer patch:', patchError);
                                }
                            }

                            // Add the overlay normally
                            return originalAddOverlay(overlay);
                        } catch (error) {
                            console.warn('Error during overlay addition:', error);
                            
                            // If it's a SynchronizedOverlay error, use DOM bypass
                            if (error.message && error.message.includes('getMap')) {
                                console.log('SynchronizedOverlay error detected, using DOM bypass');
                                
                                // Add overlay directly to DOM as fallback
                                try {
                                    if (overlay.getElement && overlay.getPosition) {
                                        const element = overlay.getElement();
                                        const position = overlay.getPosition();
                                        const pixel = map.getPixelFromCoordinate(position);
                                        
                                        if (element && pixel) {
                                            element.style.position = 'absolute';
                                            element.style.left = pixel[0] + 'px';
                                            element.style.top = pixel[1] + 'px';
                                            element.style.zIndex = '1000';
                                            element.style.pointerEvents = 'auto';
                                            
                                            // Add to map container
                                            const mapContainer = document.getElementById('map');
                                            if (mapContainer) {
                                                mapContainer.appendChild(element);
                                                console.log('Overlay added via DOM bypass');
                                                return overlay;
                                            }
                                        }
                                    }
                                } catch (domError) {
                                    console.error('DOM bypass failed:', domError);
                                }
                            }
                            
                            // Last resort: try normal addition
                            return originalAddOverlay(overlay);
                        }
                    };

                    console.log('Applied refined global SynchronizedOverlay patch');
                    
                    // Add comprehensive overlay synchronizer override
                    if (window.olcs && window.olcs.SynchronizedOverlay) {
                        const OriginalSynchronizedOverlay = window.olcs.SynchronizedOverlay;
                        window.olcs.SynchronizedOverlay = function() {
                            console.warn('SynchronizedOverlay creation blocked in 2D mode');
                            return null;
                        };
                        console.log('Applied SynchronizedOverlay constructor override');
                    }
                    
                    // Override OverlaySynchronizer to prevent any overlay synchronization
                    if (window.olcs && window.olcs.OverlaySynchronizer) {
                        const OriginalOverlaySynchronizer = window.olcs.OverlaySynchronizer;
                        window.olcs.OverlaySynchronizer = function() {
                            console.warn('OverlaySynchronizer creation blocked in 2D mode');
                            return null;
                        };
                        console.log('Applied OverlaySynchronizer constructor override');
                    }
                    
                    // Override any existing overlay synchronizer methods
                    if (window.ol3d && window.ol3d.overlaySynchronizer) {
                        window.ol3d.overlaySynchronizer.addOverlay = function() {
                            console.log('addOverlay blocked in 2D mode');
                        };
                        window.ol3d.overlaySynchronizer.synchronizeOverlays = function() {
                            console.log('synchronizeOverlays blocked in 2D mode');
                        };
                        console.log('Applied overlay synchronizer method overrides');
                    }
                    
                    // Note: OpenLayers overlay collection doesn't have off() method
                    // SynchronizedOverlay prevention is handled by constructor overrides
                }

                // Fix for contextual menu not appearing after 3D/2D mode switch
                // Restore contextual menu functionality
                setTimeout(() => {
                    console.log(' Restoring contextual menu functionality after 3D/2D switch');
                    console.log('🔧 Restoring contextual menu functionality after 3D/2D switch');

                    // Ensure all UI controls are visible and functional
                    $('.osmcat-menu').show();
                    $('.osmcat-layer').show();
                    $('.osmcat-content').show();
                    $('.ol-control').show();

                    // Re-enable all layer controls
                    const $layerControls = $('.osmcat-menu');
                    if ($layerControls.length) {
                        $layerControls.find('input[type="checkbox"]').prop('disabled', false);
                        $layerControls.find('div, button').css('opacity', '1').css('pointer-events', 'auto');
                    }

                    // Force a re-render to ensure everything is visible
                    map.renderSync();

                    console.log('✅ Contextual menu functionality restored');
                }, 500);
                
                // Skip overlay restoration completely to prevent SynchronizedOverlay errors and menu disappearance
                if (window.overlaysFor2D && window.overlaysFor2D.length > 0) {
                    console.log(`Skipping restoration of ${window.overlaysFor2D.length} overlays to prevent UI conflicts`);
                    console.log('Overlays will be recreated by user interaction when needed');
                    window.overlaysFor2D = null; // Clear stored overlays
                }
                
                // Restore original layer visibility
                map.getLayers().getArray().forEach(layer => {
                    if (layer instanceof ol.layer.Vector && layer.get('originalVisible') !== undefined) {
                        layer.setVisible(layer.get('originalVisible'));
                    }
                });
                
                // Restore all UI controls and buttons
                $('.osmcat-menu').show();
                $('.osmcat-layer').show();
                $('.osmcat-content').show();
                $('.ol-control').show();
                
                // Ensure layer selector is fully functional
                const $layerControls = $('.osmcat-menu');
                if ($layerControls.length) {
                    $layerControls.find('input[type="checkbox"]').prop('disabled', false);
                    $layerControls.find('div, button').css('opacity', '1').css('pointer-events', 'auto');
                }
                
                // Hide return to 2D button
                hideReturnTo2DButton();
                
                // Hide 3D background selector
                hide3DBackgroundSelector();
                
                // IMPORTANT: Hide any active loaders that might be showing
                if (window.loading && window.loading.forceHide) {
                    window.loading.forceHide();
                    console.log('Force hidden loader when returning to 2D');
                } else if (window.loading && window.loading.hide) {
                    window.loading.hide();
                    // Reset loading counter to prevent stuck loaders
                    window.loading.count = 0;
                    console.log('Hidden loader and reset counter when returning to 2D');
                }
                
                // Also hide any visible spinner elements directly as a backup
                $('.osmcat-loading').hide();
                $('.spinner').hide();
                $('.loading-spinner').hide();
                $('.fa-spinner').hide();
                $('.fa-spin').removeClass('fa-spin');
                console.log('Hidden all possible spinner elements');
                
                // Additional force hide with multiple selectors
                setTimeout(() => {
                    $('.osmcat-loading').hide();
                    $('.spinner').hide();
                    $('.loading-spinner').hide();
                    $('.fa-spinner').hide();
                    $('.fa-spin').removeClass('fa-spin');
                    // Also check for any elements with loading-related classes
                    $('[class*="loading"]').hide();
                    $('[class*="spinner"]').hide();
                    console.log('Second pass: Hidden all spinner elements');
                }, 100);
                
                // Update 2D map view to match 3D camera
                const view = map.getView();
                view.setCenter(ol.proj.fromLonLat([
                    Cesium.Math.toDegrees(position.longitude),
                    Cesium.Math.toDegrees(position.latitude)
                ]));
                view.setZoom(Math.log2(10000000 / position.height) / Math.log2(1.5));
                
                button.innerHTML = '<i class="fa fa-cube"></i>';
                button.title = 'Switch to 3D';
                
                // Force a re-render
                map.renderSync();
            }
        } catch (error) {
            console.error('Error toggling 3D view:', error);
            alert('Failed to initialize 3D view. Please check the console for details.');
            
            // Disable button if there was an error
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        }
    };

    // Attach the click handler to the button and store the reference
    button.addEventListener('click', clickHandler);
    button._clickHandler = clickHandler;

    return element;
}

// Function to refresh 3D imagery layers when queries interfere with background tiles
function refresh3DImagery() {
    if (!window.ol3d || !window.ol3d.getEnabled()) {
        return;
    }
    
    try {
        const scene = window.ol3d.getCesiumScene();
        
        // Clear existing imagery layers
        scene.imageryLayers.removeAll();
        
        // Get the currently visible base layer from the 2D map
        let currentBaseLayer = null;
        let imageryProvider = null;
        
        // Find the currently visible base layer
        config.layers.forEach(layer => {
            if (layer.get && layer.get('type') !== 'overlay' && layer.getVisible && layer.getVisible()) {
                currentBaseLayer = layer;
            }
        });
        
        // Choose appropriate imagery provider based on the current base layer
        if (currentBaseLayer) {
            const layerTitle = currentBaseLayer.get('title') || '';
            console.log('Refreshing 3D imagery with base layer:', layerTitle);
            
            // Map different base layers to appropriate Cesium providers
            if (layerTitle.includes('MapTiler') || layerTitle.includes('Basic')) {
                // Use a reliable satellite provider instead of MapTiler to avoid API key issues
                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    tileWidth: 256,
                    tileHeight: 256,
                    minimumLevel: 0,
                    maximumLevel: 18
                });
            } else if (layerTitle.includes('OpenStreetMap') || layerTitle.includes('OSM')) {
                // Use OSM tiles
                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    subdomains: ['a', 'b', 'c'],
                    tileWidth: 256,
                    tileHeight: 256,
                    minimumLevel: 0,
                    maximumLevel: 19
                });
            } else if (layerTitle.includes('Satellite') || layerTitle.includes('Aerial')) {
                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    tileWidth: 256,
                    tileHeight: 256,
                    minimumLevel: 0,
                    maximumLevel: 18
                });
            } else {
                // Default provider
                imageryProvider = new Cesium.UrlTemplateImageryProvider({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    tileWidth: 256,
                    tileHeight: 256,
                    minimumLevel: 0,
                    maximumLevel: 18
                });
            }
            
            // Add the imagery provider to the scene
            scene.imageryLayers.addImageryProvider(imageryProvider);
            
            console.log('3D imagery refreshed successfully');
        }
    } catch (error) {
        console.warn('Failed to refresh 3D imagery:', error);
    }
}

// Functions to show/hide persistent return to 2D button in 3D mode
function showReturnTo2DButton() {
    // Remove existing button if any
    hideReturnTo2DButton();
    
    // Find the layer selector menu
    const layerMenu = $('.osmcat-menu');
    if (layerMenu.length === 0) {
        console.error('Layer selector not found, using fallback fixed position');
        showReturnTo2DButtonFallback();
        return;
    }
    
    // Create return to 2D button
    const returnButton = document.createElement('button');
    returnButton.id = 'return-to-2d-btn';
    returnButton.innerHTML = '<i class="fa fa-map"></i> Return to 2D';
    returnButton.title = 'Return to 2D';
    returnButton.style.cssText = `
        width: 100%;
        margin: 5px 0;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    returnButton.addEventListener('click', function() {
        console.log('Return to 2D button clicked');
        
        // Try multiple methods to trigger the 3D toggle button click
        const toggle3dButton = document.querySelector('.ol-3d-toggle button');
        if (toggle3dButton) {
            console.log('Found 3D toggle button');
            
            // Method 1: Direct call to stored click handler
            if (toggle3dButton._clickHandler && typeof toggle3dButton._clickHandler === 'function') {
                console.log('Calling stored click handler directly');
                toggle3dButton._clickHandler();
                return;
            }
            
            // Method 2: Dispatch click event
            console.log('Dispatching click event');
            toggle3dButton.dispatchEvent(new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            }));
            return;
        }
        
        // Method 3: Find and disable any Cesium instances
        const controls = document.querySelectorAll('.ol-3d-toggle');
        controls.forEach(control => {
            const button = control.querySelector('button');
            if (button && button._clickHandler) {
                button._clickHandler();
                return;
            }
        });
        
        // If all else fails, try to find and disable any Cesium instances
        if (window.ol3d && window.ol3d.setEnabled) {
            console.log('Using fallback: disabling ol3d directly');
            window.ol3d.setEnabled(false);
            
            // Try to find and update the 3D toggle button state
            const toggleButton = document.querySelector('.ol-3d-toggle button');
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="fa fa-cube"></i>';
                toggleButton.title = 'Switch to 3D';
                // Try to update the internal state if possible
                if (toggleButton._clickHandler && toggleButton._clickHandler.is3d !== undefined) {
                    // This won't work because is3d is in closure, but we try anyway
                    console.log('Attempting to update internal state');
                }
            }
            
            // Restore UI elements
            $('.osmcat-menu').show();
            $('.ol-control').show();
            hideReturnTo2DButton();
            hide3DBackgroundSelector();
            
            // IMPORTANT: Hide any active loaders that might be showing
            if (window.loading && window.loading.hide) {
                window.loading.hide();
                // Reset loading counter to prevent stuck loaders
                window.loading.count = 0;
                console.log('Hidden loader and reset counter in fallback 2D return');
            }
            
            // Also hide any visible spinner elements directly as a backup
            $('.osmcat-loading').hide();
            console.log('Hidden any visible spinner elements in fallback');
        } else {
            console.error('Could not find any 3D controls to disable');
            alert('Unable to return to 2D mode. Please refresh the page.');
        }
    });
    
    returnButton.addEventListener('mouseenter', function() {
        this.style.background = '#45a049';
    });
    
    returnButton.addEventListener('mouseleave', function() {
        this.style.background = '#4CAF50';
    });
    
    // Add to the top of the layer menu
    layerMenu.prepend(returnButton);
}

function showReturnTo2DButtonFallback() {
    // Fallback to fixed position if layer menu is not found
    const returnButton = document.createElement('button');
    returnButton.id = 'return-to-2d-btn';
    returnButton.innerHTML = '<i class="fa fa-map"></i>';
    returnButton.title = 'Return to 2D';
    returnButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #ffffff;
        border: 2px solid #4CAF50;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        color: #333;
    `;
    
    returnButton.addEventListener('click', function() {
        // Same click handler as above
        const toggle3dButton = document.querySelector('.ol-3d-toggle button');
        if (toggle3dButton && toggle3dButton._clickHandler) {
            toggle3dButton._clickHandler();
        } else if (window.ol3d && window.ol3d.setEnabled) {
            window.ol3d.setEnabled(false);
            hideReturnTo2DButton();
            hide3DBackgroundSelector();
        }
    });
    
    document.body.appendChild(returnButton);
}

function hideReturnTo2DButton() {
    const returnButton = document.getElementById('return-to-2d-btn');
    if (returnButton) {
        returnButton.remove();
    }
}

function show3DBackgroundSelector() {
    // Remove existing selector if any
    hide3DBackgroundSelector();
    
    // Find the layer selector menu
    const layerMenu = $('.osmcat-menu');
    if (layerMenu.length === 0) {
        console.error('Layer selector not found, using fallback fixed position');
        show3DBackgroundSelectorFallback();
        return;
    }
    
    // Create background selector container
    const selectorContainer = document.createElement('div');
    selectorContainer.id = '3d-background-selector';
    selectorContainer.style.cssText = `
        margin: 5px 0;
        padding: 8px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
    `;
    
    const title = document.createElement('div');
    title.innerHTML = '<strong style="color: #333; font-size: 14px;">3D Background</strong>';
    title.style.marginBottom = '8px';
    selectorContainer.appendChild(title);
    
    const select = document.createElement('select');
    select.style.cssText = `
        width: 100%;
        padding: 4px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        font-size: 13px;
    `;
    
    // Add background options
    const options = [
        { value: 'osm', text: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
        { value: 'satellite', text: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
        { value: 'terrain', text: 'Terrain', url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png' }
    ];
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.text = option.text;
        optionElement.dataset.url = option.url;
        select.appendChild(optionElement);
    });
    
    select.addEventListener('change', function() {
        // Only allow background changes when in 3D mode
        if (!window.ol3d || !window.ol3d.getEnabled()) {
            console.warn('3D background changes only available in 3D mode');
            return;
        }
        
        const selectedOption = this.options[this.selectedIndex];
        const newUrl = selectedOption.dataset.url;
        change3DBackground(newUrl, selectedOption.text);
    });
    
    selectorContainer.appendChild(select);
    
    // Add to the layer menu after the return button
    const returnButton = document.getElementById('return-to-2d-btn');
    if (returnButton) {
        returnButton.after(selectorContainer);
    } else {
        layerMenu.prepend(selectorContainer);
    }
}

function show3DBackgroundSelectorFallback() {
    // Fallback to fixed position if layer menu is not found
    const selectorContainer = document.createElement('div');
    selectorContainer.id = '3d-background-selector';
    selectorContainer.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        background: #ffffff;
        border: 2px solid #2196F3;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        font-size: 14px;
        color: #333;
    `;
    
    const title = document.createElement('div');
    title.innerHTML = '<strong>3D Background</strong>';
    title.style.marginBottom = '8px';
    selectorContainer.appendChild(title);
    
    const select = document.createElement('select');
    select.style.cssText = `
        width: 150px;
        padding: 4px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
    `;
    
    // Add background options
    const options = [
        { value: 'osm', text: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
        { value: 'satellite', text: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
        { value: 'terrain', text: 'Terrain', url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png' }
    ];
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.text = option.text;
        optionElement.dataset.url = option.url;
        select.appendChild(optionElement);
    });
    
    select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const newUrl = selectedOption.dataset.url;
        change3DBackground(newUrl, selectedOption.text);
    });
    
    selectorContainer.appendChild(select);
    document.body.appendChild(selectorContainer);
}

function hide3DBackgroundSelector() {
    const selector = document.getElementById('3d-background-selector');
    if (selector) {
        selector.remove();
    }
}

function change3DBackground(newUrl, layerName) {
    // Check if we're in 3D mode and ol3d is available
    if (!window.ol3d || !window.ol3d.getEnabled()) {
        console.warn('3D background change only available in 3D mode');
        return;
    }
    
    try {
        const scene = window.ol3d.getCesiumScene();
        
        // Remove all existing imagery layers
        scene.imageryLayers.removeAll();
        
        // Create new imagery provider
        let imageryProvider;
        
        if (newUrl.includes('{s}')) {
            // OSM-style with subdomains
            imageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: newUrl,
                subdomains: ['a', 'b', 'c'],
                tileWidth: 256,
                tileHeight: 256,
                minimumLevel: 0,
                maximumLevel: 19
            });
        } else {
            // Direct URL without subdomains
            imageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: newUrl,
                tileWidth: 256,
                tileHeight: 256,
                minimumLevel: 0,
                maximumLevel: 18
            });
        }
        
        // Add error handling if available
        if (imageryProvider.errorEvent && imageryProvider.errorEvent.addEventListener) {
            imageryProvider.errorEvent.addEventListener(function(error) {
                console.warn('Imagery provider tile loading error:', error);
            });
        }
        
        // Add the new imagery provider
        scene.imageryLayers.addImageryProvider(imageryProvider);
        
        console.log('Changed 3D background to:', layerName);
        
    } catch (error) {
        console.error('Error changing 3D background:', error);
        alert('Failed to change 3D background. Please try again.');
    }
}

// Add controls to the map with proper positioning
const rotateRightControl = new ol.control.Control({
    element: rotaterightControlBuild()
});
rotateRightControl.set('className', 'ol-rotate-right ol-unselectable ol-control');
map.addControl(rotateRightControl);

const rotateLeftControl = new ol.control.Control({
    element: rotateleftControlBuild()
});
rotateLeftControl.set('className', 'ol-rotate-left ol-unselectable ol-control');
map.addControl(rotateLeftControl);

// Add 3D toggle button with higher z-index to ensure it's on top
// Wait a bit to ensure all libraries are loaded
setTimeout(() => {
    const toggle3DControl = new ol.control.Control({
        element: toggle3DControlBuild()
    });
    toggle3DControl.set('className', 'ol-3d-toggle ol-unselectable ol-control');
    map.addControl(toggle3DControl);
    
    // Ensure layer selector works in both 2D and 3D modes
    map.getLayers().on('change:length', function() {
        // Force layer controls to update when layers change
        setTimeout(() => {
            const $layerControls = $('.osmcat-menu');
            if ($layerControls.length) {
                $layerControls.find('input[type="checkbox"]').prop('disabled', false);
                $layerControls.find('div, button').css('opacity', '1').css('pointer-events', 'auto');
            }
        }, 100);
    });
}, 1000);

// Add some CSS to position the controls properly
const style = document.createElement('style');
style.textContent = `
    .ol-3d-toggle {
        right: 8.5em !important;  /* Moved further left */
        top: 0.5em !important;
    }
    .ol-zoom-in,
    .ol-zoom-out,
    .ol-zoom-extent {
        right: 0.5em !important;
    }
    .ol-zoom-in {
        top: 0.5em !important;
    }
    .ol-zoom-out {
        top: 3em !important;
    }
    .ol-rotate {
        right: 6em !important;  /* Moved left to make space for 3D button */
        top: 0.5em !important;
    }
    .ol-rotate-right {
        right: 3.5em !important;  /* Adjusted to make space for 3D button */
        top: 0.5em !important;
    }
    .ol-rotate-left {
        right: 1em !important;  /* Rightmost position */
        top: 0.5em !important;
    }
    .ol-3d-toggle button {
        background-color: rgba(255,255,255,0.4);
        border: 2px solid rgba(0,60,136,0.5);
    }
    .ol-3d-toggle button:hover {
        background-color: white;
    }
    .ol-3d-toggle button:focus {
        outline: none;
    }
`;
document.head.appendChild(style);

	// Add mobile menu toggle button (only on mobile) - moved to after map is ready
	$(document).ready(function() {
		if (window.innerWidth <= 599 && window.map) {
			var menuToggleButton = $('<button>')
				.addClass('menu-toggle')
				.html('<i class="fa fa-bars"></i>')
				.on('click touchstart', function(e) {
					e.preventDefault(); // Prevent default touch behavior
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

			// DISABLED: Automatic restoration of tag queries from browser history
			// Only execute queries when user clicks the button
			if (event.state.tagQueries && Array.isArray(event.state.tagQueries)) {
				console.log('🔍 Tag queries from browser history found but NOT executed automatically:', event.state.tagQueries);
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
			console.log('🗺️ Map clicked - processing click event');

			var coordinate = evt.coordinate,
					coordinateLL = ol.proj.toLonLat(coordinate),
					coordinateText = ol.coordinate.format(coordinateLL, '[{y}, {x}]', 5);
			console.log('📍 Click coordinates:', coordinateText);

			var pinMap = new ol.Overlay({
				element: $('<div>').addClass('osmcat-map-pin').attr('title', coordinateText).html('<i class="fa fa-map-pin"></i>')[0],
				position: coordinate
				//positioning: 'bottom-center' //BUG center no funciona correctament en la v6.1.1 -> FIX setPositioning
			});

			// Fix for 3D/2D overlay synchronization issue
			try {
				// Check if we're in 3D mode and ol3d exists
				if (window.ol3d && window.ol3d.getEnabled()) {
					console.log('📌 Adding overlay in 3D mode - using direct addition');
					// In 3D mode, add overlay directly to the map
					map.addOverlay(pinMap);
					pinMap.setPositioning('bottom-center');
				} else {
					// In 2D mode, use normal overlay addition
					console.log('📌 Adding overlay in 2D mode');

					// Check if overlay synchronizer is causing issues
					if (window.ol3d && window.ol3d.overlaySynchronizer) {
						console.log('🔧 Temporarily disabling overlay synchronizer for this operation');
						const originalSync = window.ol3d.overlaySynchronizer.synchronizeOverlays;
						window.ol3d.overlaySynchronizer.synchronizeOverlays = function() {
							console.log('🚫 Skipping overlay synchronization to prevent errors');
						};

						// Add overlay with synchronizer disabled
						map.addOverlay(pinMap);
						pinMap.setPositioning('bottom-center');

						// Restore synchronizer after a short delay
						setTimeout(() => {
							window.ol3d.overlaySynchronizer.synchronizeOverlays = originalSync;
							console.log('🔧 Restored overlay synchronizer');
						}, 100);
					} else {
						// Normal overlay addition
						map.addOverlay(pinMap);
						pinMap.setPositioning('bottom-center');
					}
				}
			} catch (error) {
				console.error('❌ Error adding overlay:', error);

				// More robust fallback - create a simple DOM overlay
				if (error.message.includes('getMap') || error.message.includes('SynchronizedOverlay')) {
					console.log('🚨 SynchronizedOverlay error detected, using DOM fallback');

					// Create a simple DOM element overlay
					const domOverlay = document.createElement('div');
					domOverlay.className = 'osmcat-map-pin';
					domOverlay.title = coordinateText;
					domOverlay.innerHTML = '<i class="fa fa-map-pin"></i>';
					domOverlay.style.position = 'absolute';
					domOverlay.style.left = evt.pixel[0] + 'px';
					domOverlay.style.top = evt.pixel[1] + 'px';
					domOverlay.style.zIndex = '1000';

					// Add to map container
					document.getElementById('map').appendChild(domOverlay);

					// Remove after dialog closes
					setTimeout(() => {
						if (domOverlay.parentNode) {
							domOverlay.parentNode.removeChild(domOverlay);
						}
					}, 10000);
				} else {
					// Try direct overlay addition as last resort
					try {
						map.addOverlay(pinMap);
						pinMap.setPositioning('bottom-center');
					} catch (fallbackError) {
						console.error('❌ All overlay addition methods failed:', fallbackError);
					}
				}
			} finally {
				// Ensure loader is hidden regardless of success/failure
				if (window.loading && window.loading.hide) {
					window.loading.hide();
					window.loading.count = 0;
					console.log('🔄 Forced loader to hide after overlay operation');
				}
			}

			console.log('📌 Pin overlay added to map');

		var popupContingut = null;
		try {
			popupContingut = config.onClickEvent.call(this, evt, view, coordinateLL);
			console.log('📋 onClickEvent executed successfully');
		} catch (error) {
			console.error('❌ Error in config.onClickEvent:', error);
			popupContingut = $('<div>').html('Error generating click content');
		}

		var nodeInfo = $('<div>');
		var numFeatures = 0;
		try {
			map.forEachFeatureAtPixel(evt.pixel, function (feature) {
				numFeatures++;
				console.log('🎯 Found feature at pixel:', feature.getId(), feature.getProperties());
				try {
					nodeInfo.append(config.forFeatureAtPixel.call(this, evt, feature));
				} catch (featureError) {
					console.error('❌ Error processing feature:', featureError);
					nodeInfo.append($('<div>').html('Error processing feature: ' + feature.getId()));
				}
			});
			console.log('🔍 Found', numFeatures, 'features at click location');
		} catch (pixelError) {
			console.error('❌ Error in forEachFeatureAtPixel:', pixelError);
		}

		var popupContingutExtra = null;
		try {
			popupContingutExtra = config.onClickEventExtra.call(this, evt, view, coordinateLL, numFeatures);
			console.log('📋 onClickEventExtra executed successfully');
		} catch (extraError) {
			console.error('❌ Error in config.onClickEventExtra:', extraError);
			popupContingutExtra = $('<div>').html('Error generating extra content');
		}

		console.log('💬 Creating dialog with content');
		try {
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
			console.log('✅ Dialog created successfully');
		} catch (dialogError) {
			console.error('❌ Error creating dialog:', dialogError);
			alert('Error creating popup dialog - check console for details');
		}

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
    // console.log('🔗 Legend queries:', tagQueries);

    // Check map layers for tag queries as primary method
    if (window.map) {
        // console.log('🔗 Scanning map layers for tag queries');
        const allTagQueryLayers = [];

        // Recursively search through all layers (including layer groups)
        function findTagQueryLayers(layers) {
            layers.forEach(layer => {
                // Check if this layer is a tag query layer
                if (layer.get && layer.get('id') && layer.get('id').startsWith('tag_')) {
                    const layerId = layer.get('id');
                    const title = layer.get('title') || '';
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
                    } else {
                    }

                }

                // If this layer is a group, recursively search its layers
                if (layer.getLayers && typeof layer.getLayers === 'function') {
                    const subLayers = layer.getLayers().getArray();
                    if (subLayers.length > 0) {
                        findTagQueryLayers(subLayers);
                    }
                }
            });
        }

        const mapLayers = window.map.getLayers().getArray();
        // console.log(`🔗 Starting recursive search with ${mapLayers.length} top-level layers`);
        findTagQueryLayers(mapLayers);

        // console.log('🔗 Total tag query layers found:', allTagQueryLayers);

        // Use found layers as tag queries
        if (allTagQueryLayers.length > 0) {
            tagQueries.push(...allTagQueryLayers);
            // console.log('🔗 Using map layer queries:', tagQueries);
        }
    }

    // console.log('🔗 Final tag queries to add to URL:', tagQueries);

    // Build URL parameters - only include non-map parameters to avoid duplication with hash
    const params = new URLSearchParams();

    // Get current selected element types
    const currentSelectedElementTypes = getSelectedElementTypes();

    // Group tag queries by key:value and use current element type selection for all
    const tagQueryElements = new Map();
    tagQueries.forEach(query => {
        const key = `${query.key}:${query.value}`;
        if (!tagQueryElements.has(key)) {
            tagQueryElements.set(key, new Set());
        }
        // Use the current selected element types for all queries
        currentSelectedElementTypes.forEach(type => {
            if (type === 'node') tagQueryElements.get(key).add('n');
            else if (type === 'way') tagQueryElements.get(key).add('w');
            else if (type === 'relation') tagQueryElements.get(key).add('r');
        });
    });

    // Add tag queries to URL with element type acronyms
    tagQueryElements.forEach((elementTypes, keyValue) => {
        const sortedTypes = Array.from(elementTypes).sort().join(''); // nwr
        const tagWithTypes = `${keyValue}[${sortedTypes}]`;
        // console.log('🔗 Adding tag to URL:', tagWithTypes);
        params.append('tag', tagWithTypes);
    });

    // Do NOT add lat/lon/zoom to query string - these are already in the hash
    // Only preserve language parameter if present
    const currentUrl = new URL(window.location.href);
    const currentLang = currentUrl.searchParams.get('lang');
    if (currentLang) {
        params.append('lang', currentLang);
    }

    // Clean hash of tag parameters before using it
    let cleanHash = window.location.hash;
    if (cleanHash) {
        // Remove tag parameters from hash
        const hashParts = cleanHash.split('&').filter(part => {
            // Keep map parameter and overlay parameters, remove tag parameters
            return part.startsWith('#map=') || (!part.startsWith('tag=') && !part.startsWith('tag.'));
        });
        cleanHash = hashParts.join('&');
    }

    // Update URL without triggering page reload
    // If no query parameters, just use the cleaned hash
    const queryString = params.toString();
    const newUrl = queryString
        ? `${window.location.origin}${window.location.pathname}?${queryString}${cleanHash}`
        : `${window.location.origin}${window.location.pathname}${cleanHash}`;

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
