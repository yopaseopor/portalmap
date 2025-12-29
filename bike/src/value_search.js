/**
 * Value search UI and behavior
 * Restored from backup and minimally modified to add a checkbox to switch
 * between the default taginfo CSV and a yes/no-focused CSV.
 */

/**
 * Process query results and add them to the map
 * @param {Array} allFeatures - Array of features returned from the query
 * @param {string} key - The OSM key
 * @param {string} value - The OSM value
 */
function processQueryResults(allFeatures, key, value) {
    // Calculate execution time
    const endTime = performance.now();
    const executionTime = ((endTime - window.queryStartTime) / 1000).toFixed(3) + 's';

    // Fix invalid geometries
    const fixedFeatures = allFeatures.map((feature, index) => {
        const geometry = feature.getGeometry();
        const geometryType = geometry.getType();

        if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            try {
                const coords = geometry.getCoordinates();
                if (!coords || coords.length < 2) {
                    if (!coords || coords.length === 0) {
                        const tinyLine = new ol.geom.LineString([[0, 0], [0.001, 0.001]]);
                        feature.setGeometry(tinyLine);
                        feature.set('fixedGeometry', true);
                    } else if (coords.length === 1) {
                        const point = coords[0];
                        const fixedCoords = [point, [point[0] + 0.001, point[1] + 0.001]];
                        const fixedLine = new ol.geom.LineString(fixedCoords);
                        feature.setGeometry(fixedLine);
                        feature.set('fixedGeometry', true);
                    }
                }
            } catch (error) {
                const tinyLine = new ol.geom.LineString([[0, 0], [0.001, 0.001]]);
                feature.setGeometry(tinyLine);
                feature.set('fixedGeometry', true);
            }
        }

        return feature;
    });

    // Filter valid features
    const validFeatures = fixedFeatures.filter((feature, index) => {
        const geometry = feature.getGeometry();
        if (!geometry || !geometry.getType()) {
            return false;
        }
        return true;
    });

    // Generate overlay info
    const overlayId = `tag_${key}_${value}`;
    const overlayTitle = `${key}=${value}`;
    const uniqueColor = generateQueryColor(overlayId, false); // Use overlayId for consistent colors

    // Create vector layer
    const vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            format: new ol.format.OSMXML(),
            loader: function() {
                // Explicitly do nothing - loading is handled in executeTagQuery
                return null;
            }
        }),
        title: overlayTitle,
        id: overlayId,
        iconSrc: 'src/img/icones_web/tag_icon.png',
        iconStyle: 'filter: hue-rotate(120deg);',
        visible: true,
        style: function(feature) {
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType();

            if (geometryType === 'Point') {
                const originalType = feature.get('originalType');
                if (originalType === 'LineString') {
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({
                                color: generateQueryColor(vectorLayer.get('id'), true)
                            }),
                            stroke: new ol.style.Stroke({
                                color: generateQueryColor(vectorLayer.get('id'), true),
                                width: 2
                            })
                        })
                    });
                }
                if (originalType === 'Polygon') {
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 6,
                            fill: new ol.style.Fill({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                            }),
                            stroke: new ol.style.Stroke({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 1.0],
                                width: 2
                            })
                        })
                    });
                }
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 4,
                        fill: new ol.style.Fill({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 0.6]
                        }),
                        stroke: new ol.style.Stroke({
                            color: generateQueryColor(vectorLayer.get('id'), false),
                            width: 1
                        })
                    })
                });
            }

            if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
                const isFixed = feature.get('fixedGeometry');
                const color = generateQueryColor(overlayId, false); // Use consistent color base

                return new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: isFixed ? 3 : 4
                    })
                });
            }

            if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
                try {
                    const area = geometry.getArea();
                    if (isNaN(area) || area <= 0) {
                        const centroid = ol.extent.getCenter(geometry.getExtent());
                        return new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({
                                    color: [...generateQueryColor(vectorLayer.get('id'), false), 0.8]
                                }),
                                stroke: new ol.style.Stroke({
                                    color: [...generateQueryColor(vectorLayer.get('id'), false), 1.0],
                                    width: 2
                                })
                            }),
                            geometry: new ol.geom.Point(centroid)
                        });
                    }
                    return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: generateQueryColor(vectorLayer.get('id'), false),
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 0.05]
                        })
                    });
                } catch (error) {
                    const centroid = ol.extent.getCenter(geometry.getExtent());
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 6,
                            fill: new ol.style.Fill({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                            }),
                            stroke: new ol.style.Stroke({
                                color: generateQueryColor(vectorLayer.get('id'), false),
                                width: 2
                            })
                        }),
                        geometry: new ol.geom.Point(centroid)
                    });
                }
            }

            const centroid = ol.extent.getCenter(geometry.getExtent());
            return new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                    }),
                    stroke: new ol.style.Stroke({
                        color: generateQueryColor(vectorLayer.get('id'), false),
                        width: 2
                    })
                }),
                geometry: new ol.geom.Point(centroid)
            });
        }
    });

    // Set additional properties
    vectorLayer.set('group', 'Tag Queries');
    vectorLayer.set('type', 'overlay');
    vectorLayer.set('title', overlayTitle);
    vectorLayer.set('id', overlayId);
    vectorLayer.set('iconSrc', 'src/img/icones_web/tag_icon.png');
    vectorLayer.set('iconStyle', 'filter: hue-rotate(120deg);');

    // Add to legend
    window.tagQueryLegend.addQuery(overlayId, key, value, uniqueColor, 0, true);

    // Filter features with tags for display and statistics
    const featuresWithTags = validFeatures.filter(feature => {
        const properties = feature.getProperties();

        // Check if this feature has OSM tags (not metadata or internal properties)
        const internalProps = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry',
                             'members', 'memberOf', 'member', 'membership', 'role'];
        const metadataProps = ['version', 'timestamp', 'changeset', 'user', 'uid', 'visible'];

        return Object.keys(properties).some(prop =>
            !internalProps.includes(prop) && !metadataProps.includes(prop)
        );
    });

    // Add features with tags to the map (for display)
    vectorLayer.getSource().addFeatures(featuresWithTags);

    // Update legend with correct count (only elements with tags)
    window.tagQueryLegend.updateCount(overlayId, featuresWithTags.length);

    // Update query statistics - COUNT ALL NODES, not just tagged ones
    const nodeStats = validFeatures.reduce((acc, feature) => {
        const geometryType = feature.getGeometry().getType();
        const properties = feature.getProperties();

        if (geometryType === 'Point') {
            // Check if this node has OSM tags (not metadata or internal properties)
            const hasOSMTags = Object.keys(properties).some(prop => {
                // OSM tags are properties that describe the element's characteristics
                // They should be key=value pairs like amenity, name, highway, etc.
                // NOT structural properties or metadata

                const systemProps = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry'];
                const metadataProps = ['version', 'timestamp', 'changeset', 'user', 'uid', 'visible'];
                const structuralProps = ['members', 'memberOf', 'member', 'membership', 'role'];

                // A property is an OSM tag if it's NOT in any of these categories
                return !systemProps.includes(prop) && !metadataProps.includes(prop) && !structuralProps.includes(prop);
            });

            if (hasOSMTags) {
                acc.standaloneNodes = (acc.standaloneNodes || 0) + 1;
            } else {
                acc.polygonNodes = (acc.polygonNodes || 0) + 1;
            }

            // Debug: Log properties of nodes to understand classification
            if (acc.standaloneNodes + acc.polygonNodes <= 3) { // Only log first few
                const nonSystemProps = Object.keys(properties).filter(prop => {
                    const systemProps = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry'];
                    const metadataProps = ['version', 'timestamp', 'changeset', 'user', 'uid', 'visible'];
                    const structuralProps = ['members', 'memberOf', 'member', 'membership', 'role'];
                    return !systemProps.includes(prop) && !metadataProps.includes(prop) && !structuralProps.includes(prop);
                });
                console.log(`🔍 Node ${acc.standaloneNodes + acc.polygonNodes}:`, {
                    hasOSMTags,
                    nonSystemProps,
                    totalProps: Object.keys(properties).length
                });
            }
        } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            acc.ways = (acc.ways || 0) + 1;
        } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
            acc.polygons = (acc.polygons || 0) + 1;
        }

        return acc;
    }, {});

    console.log('📊 Node statistics:', nodeStats);

    updateQueryStatistics({
        query: `${key}=${value}`,
        dataSize: formatBytes(allFeatures.length * 100), // Approximate data size
        executionTime: executionTime,
        nodes: nodeStats.standaloneNodes || 0,
        polygonNodes: nodeStats.polygonNodes || 0,
        ways: nodeStats.ways || 0,
        relations: nodeStats.polygons || 0,
        polygons: nodeStats.polygons || 0,
        color: Array.isArray(uniqueColor) ? uniqueColor.slice(0, 3) : [100, 100, 200] // Ensure RGB array without alpha
    });

    // Add vector layer to map
    const tagQueriesGroup = findOrCreateTagOverlaysGroup();
    if (tagQueriesGroup) {
        tagQueriesGroup.getLayers().push(vectorLayer);
        // Ensure the group is actually added to the map
        if (window.map) {
            const mapLayers = window.map.getLayers().getArray();
            if (!mapLayers.some(l => l === tagQueriesGroup)) {
                console.log('🔍 Tag Queries group not present in map yet, adding it now');
                window.map.addLayer(tagQueriesGroup);
            }
        }
    }

    // Dispatch events
    window.dispatchEvent(new CustomEvent('tagQueryAdded', {
        detail: { key, value, overlayId }
    }));

    // Clear running guard for this query so future executions are allowed
    try {
        if (window._runningTagQueries && window._runningTagQueries.has(overlayId)) {
            window._runningTagQueries.delete(overlayId);
            console.log('✅ Cleared running guard for', overlayId);
        }
    } catch (delErr) {
        console.warn('Could not clear running guard for', overlayId, delErr);
    }

    $('#execute-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryExecuted') : 'Query Executed'} - ${window.getTranslation ? window.getTranslation('clickToRepeat') : 'Click to Repeat'}`);
    $('#clear-search-btn').show();

    // If we added features, make sure they are visible: fit view to features and render
    try {
        const src = vectorLayer.getSource();
        const feats = src.getFeatures ? src.getFeatures() : [];
        console.log('🎯 Added features count for overlay', overlayId, ':', feats.length);

        // Ensure layer is visible and on top
        try {
            vectorLayer.setVisible(true);
            // Give it a high z-index so it renders above basemap/other overlays
            if (typeof vectorLayer.setZIndex === 'function') vectorLayer.setZIndex(1000);
        } catch (zErr) {
            console.warn('⚠️ Could not set zIndex on vector layer:', zErr);
        }

        if (feats.length > 0 && window.map) {
            const featuresExtent = src.getExtent();

            console.log('🎯 Features extent:', featuresExtent);

            // Validate extent numbers (must be finite and not empty)
            const isValidExtent = featuresExtent && !ol.extent.isEmpty(featuresExtent) &&
                featuresExtent.every(coord => Number.isFinite(coord));

            if (isValidExtent) {
                try {
                    const mapView = window.map.getView();
                    const mapSize = window.map.getSize();
                    const viewExtent = mapView.calculateExtent(mapSize);

                    // Only fit the view if the features extent is not already fully inside the current view
                    const needFit = !(ol.extent.containsExtent(viewExtent, featuresExtent));
                    console.log('🔎 View extent contains features extent?', ol.extent.containsExtent(viewExtent, featuresExtent), 'needFit:', needFit);

                    if (needFit) {
                        console.log('🔎 Fitting map view to new features extent for overlay', overlayId);
                        // Fit with padding and maxZoom to avoid zooming too far
                        mapView.fit(featuresExtent, { size: mapSize, maxZoom: 18, padding: [50, 50, 50, 50] });
                    } else {
                        console.log('🔎 Features already within view; skipping fit to avoid flash');
                    }
                } catch (fitErr) {
                    console.warn('⚠️ Error fitting view to extent:', fitErr);
                }
            } else {
                console.warn('⚠️ Invalid features extent, skipping fit:', featuresExtent);
            }

            // Force synchronous render to ensure visibility
            try {
                window.map.renderSync();
            } catch (rsErr) {
                console.warn('⚠️ renderSync failed, calling render instead:', rsErr);
                window.map.render();
            }
        }
    } catch (err) {
        console.error('🎯 Error while trying to show features on map:', err);
    }
}

/**
 * Execute a single query with retry logic
 * @param {string} query - The query to execute
 * @param {string} queryType - Type of query for logging
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise} Promise resolving to features array
 */
function executeSingleQuery(query, queryType, retryCount = 0) {
    return new Promise((resolve, reject) => {
        const client = new XMLHttpRequest();
        const apiUrl = retryCount > 0 ? config.overpassApiFallback() : config.overpassApi();
        client.open('POST', apiUrl);
        client.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
        client.timeout = 60000; // Increased timeout to 60 seconds

        // Hide loading indicator when request completes, regardless of success/failure
        client.onloadend = function() {
            if (window.loading) window.loading.hide();
        };

        client.onload = function() {
            if (client.status === 200) {
                try {
                    const xmlDoc = $.parseXML(client.responseText);
                    const xml = $(xmlDoc);
                    const remark = xml.find('remark');

                    if (remark.length !== 0) {
                        console.error('Overpass error:', remark.text());
                        reject(new Error(`Overpass error: ${remark.text()}`));
                    } else {
                        const features = new ol.format.OSMXML().readFeatures(xmlDoc, {
                            featureProjection: window.map.getView().getProjection()
                        });
                        resolve(features);
                    }
                } catch (parseError) {
                    console.error('Error parsing XML response:', parseError);
                    reject(parseError);
                }
            } else {
                console.error('Request failed with status:', client.status);
                if (client.status === 504 || client.status === 429 || client.status >= 500) {
                    // Retry with fallback server if we haven't retried too many times
                    if (retryCount < 3) {
                        console.log(`Retrying with fallback server (attempt ${retryCount + 1}/3)...`);
                        setTimeout(() => {
                            executeSingleQuery(query, queryType, retryCount + 1)
                                .then(resolve)
                                .catch(reject);
                        }, 1000); // Wait 1 second before retry
                        return;
                    } else {
                        reject(new Error(`Timeout: All servers overloaded (${queryType} query)`));
                    }
                } else {
                    reject(new Error(`HTTP ${client.status} (${queryType} query)`));
                }
            }
        };

        client.onerror = function() {
            console.error('Network error');
            // Retry with fallback server if we haven't retried too many times
            if (retryCount < 3) {
                console.log(`Retrying with fallback server due to network error (attempt ${retryCount + 1}/3)...`);
                setTimeout(() => {
                    executeSingleQuery(query, queryType, retryCount + 1)
                        .then(resolve)
                        .catch(reject);
                }, 1000); // Wait 1 second before retry
                return;
            } else {
                reject(new Error(`Network error - all servers failed (${queryType} query)`));
            }
        };

        client.ontimeout = function() {
            console.error('Request timed out');
            // Retry with fallback server if we haven't retried too many times
            if (retryCount < 3) {
                console.log(`Retrying with fallback server due to timeout (attempt ${retryCount + 1}/3)...`);
                setTimeout(() => {
                    executeSingleQuery(query, queryType, retryCount + 1)
                        .then(resolve)
                        .catch(reject);
                }, 1000); // Wait 1 second before retry
                return;
            } else {
                reject(new Error(`Timeout: All servers overloaded (${queryType} query)`));
            }
        };

        client.send(query);
    });
}

/**
 * Perform value search with debouncing and results display
 * @param {string} query - The search query
 * @param {string} key - Optional key to filter by
 * @param {boolean} useYesCsv - Whether to use yes/no focused CSV
 */
function performValueSearch(query, key, useYesCsv = false) {
    let results = []; // Initialize results variable

    try {
        // Read checkbox state (default false)
        const useYesCsv = $('#use-yes-csv-checkbox').is(':checked');

        // Choose appropriate loader/init function
        const ensureLoaded = useYesCsv ? window.initTaginfoAPIYes : window.initTaginfoAPI;
        const loadedFlag = useYesCsv ? (window.taginfoDataYes && window.taginfoDataYes.loaded) : (window.taginfoData && window.taginfoData.loaded);

        if (!loadedFlag) {
            console.log('Taginfo data for requested dataset not loaded, initializing...');
            if (ensureLoaded) {
                ensureLoaded().then(() => {
                    console.log('Taginfo API (requested dataset) initialized, retrying search');
                    window.performValueSearch(query, key);
                }).catch(error => {
                    console.error('Failed to initialize taginfo API for requested dataset:', error);
                });
            } else {
                console.error('No init function for requested taginfo dataset');
            }
            return;
        }

        results = window.searchValues(query, key, 100, useYesCsv);
        currentResults = results;

        // Check if displayValueResults exists before calling it
        if (typeof displayValueResults === 'function') {
            displayValueResults(results, query);
        } else {
            console.error('displayValueResults is not defined');
        }

        // Trigger custom event for other components
        searchInput.trigger('valueSearchResults', [results, key]);
    } catch (error) {
        console.error('Error in performValueSearch:', error);
    }
}

/**
 * Find or create a layer group for tag query overlays
 */
function findOrCreateTagOverlaysGroup() {
    console.log('🔍 Looking for Tag Queries group');

    // SINGLE CHECK: First check if group already exists in map (fastest)
    if (window.map) {
        const existingLayers = window.map.getLayers().getArray();
        for (let i = 0; i < existingLayers.length; i++) {
            const layer = existingLayers[i];
            if (layer.get && layer.get('type') === 'tag-query' && layer.get('title') === 'Tag Queries') {
                console.log('🔍 Found existing Tag Queries group in map');
                return layer;
            }
        }
    }

    // SINGLE CHECK: If not in map, check config.layers (fallback)
    console.log('🔍 Checking config.layers for Tag Queries group');
    console.log('🔍 Total layers in config:', config.layers.length);

    for (let i = 0; i < config.layers.length; i++) {
        const layer = config.layers[i];

        if (layer.get && layer.get('type') === 'tag-query' && layer.get('title') === 'Tag Queries') {
            console.log('🔍 Found existing Tag Queries group at index', i);

            // If map exists, ensure layer group is in it
            if (window.map && !window.map.getLayers().getArray().includes(layer)) {
                console.log('🔍 Layer group not in map, adding it');
                window.map.addLayer(layer);
            }

            return layer;
        }
    }

    // If we get here, the group doesn't exist, so create it
    console.log('🔍 Creating new Tag Queries group');
    const overlaysGroup = new ol.layer.Group({
        title: 'Tag Queries',
        type: 'tag-query',
        visible: true,
        zIndex: 1000, // Ensure it's on top of other layers
        layers: []
    });

    // Add to config.layers
    config.layers.push(overlaysGroup);

    if (window.map) {
        window.map.addLayer(overlaysGroup);
    }

    return overlaysGroup;
}

/**
 * Format a detailed count of elements
 * @param {Object} counts - Object containing count information
 * @param {number} counts.nodes - Number of nodes
 * @param {number} counts.ways - Number of ways
 * @param {number} counts.relations - Number of relations
 * @param {boolean} [detailedSummary=false] - Whether to show detailed summary
 * @returns {string} Formatted count string
 */
function formatDetailedCount(counts, detailedSummary = false) {
    const parts = [];
    
    if (counts.nodes) parts.push(`${counts.nodes} ${window.getTranslation ? window.getTranslation('nodes') : 'nodes'}`);
    if (counts.ways) parts.push(`${counts.ways} ${window.getTranslation ? window.getTranslation('ways') : 'ways'}`);
    if (counts.relations) parts.push(`${counts.relations} ${window.getTranslation ? window.getTranslation('relations') : 'relations'}`);
    
    if (parts.length === 0) return `0 ${window.getTranslation ? window.getTranslation('features') : 'features'}`;
    return parts.join(', ');
}

/**
 * Format a detailed count of elements with node separation
 * @param {Object} nodeStats - Object containing node statistics
 * @param {number} nodeStats.standaloneNodes - Number of standalone nodes
 * @param {number} nodeStats.polygonNodes - Number of polygon nodes
 * @param {number} nodeStats.ways - Number of ways
 * @param {number} nodeStats.polygons - Number of polygons
 * @param {boolean} [detailedSummary=false] - Whether to show detailed summary
 * @returns {string} Formatted count string with node separation
 */
function formatDetailedCountWithNodeSeparation(nodeStats, detailedSummary = false) {
    const parts = [];

    // Show standalone nodes and polygon nodes separately
    if (nodeStats.standaloneNodes) parts.push(`${nodeStats.standaloneNodes} ${window.getTranslation ? window.getTranslation('standaloneNodes') : 'standalone nodes'}`);
    if (nodeStats.polygonNodes) parts.push(`${nodeStats.polygonNodes} ${window.getTranslation ? window.getTranslation('polygonNodes') : 'polygon nodes'}`);

    if (nodeStats.ways) parts.push(`${nodeStats.ways} ${window.getTranslation ? window.getTranslation('ways') : 'ways'}`);
    if (nodeStats.polygons) parts.push(`${nodeStats.polygons} ${window.getTranslation ? window.getTranslation('relations') : 'relations'}`);

    if (parts.length === 0) return `0 ${window.getTranslation ? window.getTranslation('features') : 'features'}`;
    return parts.join(', ');
}

/**
 * Format bytes into a human-readable string
 * @param {number} bytes - The number of bytes to format
 * @returns {string} Formatted string with appropriate unit (B, KB, MB, GB)
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Highlight search query matches in text
 * @param {string} text - The text to search in
 * @param {string} query - The search query to highlight
 * @returns {string} HTML with highlighted matches
 */
function highlightText(text, query) {
    if (!query || !text) return escapeHtml(text);

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Find all occurrences of the query in the text
    const parts = [];
    let lastIndex = 0;
    let index = textLower.indexOf(queryLower);

    while (index !== -1) {
        // Add text before the match
        if (index > lastIndex) {
            parts.push(escapeHtml(text.substring(lastIndex, index)));
        }

        // Add highlighted match
        parts.push(`<mark>${escapeHtml(text.substring(index, index + query.length))}</mark>`);

        lastIndex = index + query.length;
        index = textLower.indexOf(queryLower, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(escapeHtml(text.substring(lastIndex)));
    }

    return parts.join('');
}

/**
 * Format a value count with appropriate text based on the count
 * @param {number} count - The count of occurrences
 * @param {string} definition - The definition or description of the value
 * @returns {string} Formatted count or description
 */
function formatValueCount(count, definition) {
    if (count > 0) {
        const numberPart = formatNumber(count);
        return `${numberPart} ${window.getTranslation ? window.getTranslation('uses') : 'uses'}`;
    } else {
        // For values with 0 uses, show a brief description instead
        return definition 
            ? definition.substring(0, 60) + (definition.length > 60 ? '...' : '') 
            : `${window.getTranslation ? window.getTranslation('noDescriptionAvailable') : 'No description available'}`;
    }
}

/**
 * Update query statistics display
 * @param {Object} stats - Statistics to display
 */
function updateQueryStatistics(stats) {
    console.log('📊 Updating query statistics:', stats);

    // Show the statistics container
    const statsContainer = $('#query-statistics');
    if (statsContainer.length > 0) {
        statsContainer.show();

        // Update query
        $('#current-query').text(stats.query || '-');

        // Update execution time
        $('#execution-time').text(stats.executionTime || '0.000s');

        // Update data size
        $('#data-size').text(stats.dataSize);

        // Update element counts
        $('#nodes-count').text(formatNumber(stats.nodes));
        $('#polygon-nodes-count').text(formatNumber(stats.polygonNodes));
        $('#ways-count').text(formatNumber(stats.ways));
        $('#relations-count').text(formatNumber(stats.relations));
        $('#polygons-count').text(formatNumber(stats.polygons));

        // Update color indicators
        $('.stat-value').removeClass('color-indicator');
        $('#current-query, #execution-time, #data-size, #nodes-count, #polygon-nodes-count, #ways-count, #relations-count, #polygons-count')
            .addClass('color-indicator')
            .css('background-color', `rgba(${stats.color[0]}, ${stats.color[1]}, ${stats.color[2]}, 0.1)`)
            .css('border-left', `3px solid rgb(${stats.color[0]}, ${stats.color[1]}, ${stats.color[2]})`);

        // Apply the color as background for the color indicators
        $('.stat-value.color-indicator').each(function() {
            const $this = $(this);
            $this.css({
                'background-color': `rgba(${stats.color[0]}, ${stats.color[1]}, ${stats.color[2]}, 0.1)`,
                'border-left': `3px solid rgb(${stats.color[0]}, ${stats.color[1]}, ${stats.color[2]})`,
                'padding-left': '16px'
            });
        });

        console.log('📊 Query statistics updated successfully');
    }
}

/**
 * Format a number with commas as thousand separators
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Get the currently selected element types from checkboxes
 * @returns {string[]} Array of selected element types (node, way, relation)
 */
function getSelectedElementTypes() {
    // Get selected element types from checkboxes or default to all
    const elementTypesCheckboxes = $('.element-type-checkbox:checked');
    console.log('🔍 getSelectedElementTypes: Found', elementTypesCheckboxes.length, 'checked checkboxes');

    if (elementTypesCheckboxes.length > 0) {
        const values = elementTypesCheckboxes.map((i, el) => $(el).val()).get();
        console.log('🔍 getSelectedElementTypes: Selected values:', values);
        return values;
    }

    console.log('🔍 getSelectedElementTypes: No checkboxes found, returning defaults');
    return ['node', 'way', 'relation'];
}






/**
 * Generate a consistent color based on overlay ID hash
 */
function generateQueryColor(overlayId, isFixed = false) {
    // Generate a consistent color based on overlay ID hash
    let hash = 0;
    for (let i = 0; i < overlayId.length; i++) {
        const char = overlayId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Generate vibrant colors using HSL color space
    const hue = Math.abs(hash) % 360;
    const saturation = 70 + (Math.abs(hash * 7) % 20); // 70-90%
    const lightness = isFixed ? 45 : 55; // Slightly darker for fixed geometries

    // Convert HSL to RGB
    const hslToRgb = (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;
        if (s === 0) {
            r = g = b = l; // Achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    };

    return hslToRgb(hue, saturation, lightness);
}

/**
 * Generate a unique color for a key-value pair using a simple hash function
 */
function generateUniqueColor(key, value) {
    // Create a simple hash from the key-value combination
    const combined = `${key}:${value}`;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert hash to RGB values
    const r = Math.abs(hash) % 255;
    const g = Math.abs(hash >> 8) % 255;
    const b = Math.abs(hash >> 16) % 255;

    // Ensure good contrast and visibility by adjusting values
    const adjustedR = Math.max(50, Math.min(200, r));
    const adjustedG = Math.max(50, Math.min(200, g));
    const adjustedB = Math.max(50, Math.min(200, b));

    return [adjustedR, adjustedG, adjustedB];
}

/**
 * Legend data structure for active queries
 */
window.tagQueryLegend = {
    queries: new Map(), // Maps overlayId -> {key, value, color, count, visible}

    /**
     * Add or update a query in the legend
     */
    addQuery(overlayId, key, value, color, count = 0, visible = true, elementTypes = null) {
            const queryObject = {
            key,
            value,
            color,
            count,
            visible,
            elementTypes: elementTypes || getSelectedElementTypes(), // Store selected element types
            timestamp: Date.now()
        };
        this.queries.set(overlayId, queryObject);
        this.updateLegendDisplay();
    },

    /**
     * Remove a query from the legend
     */
    removeQuery(overlayId) {
        this.queries.delete(overlayId);
        this.updateLegendDisplay();

        // Trigger URL update event after query removal
        window.dispatchEvent(new CustomEvent('tagQueryRemoved', {
            detail: { overlayId }
        }));
    },

    /**
     * Update the count for a query
     */
    updateCount(overlayId, count) {
        if (this.queries.has(overlayId)) {
            this.queries.get(overlayId).count = count;
            this.updateLegendDisplay();

            // Trigger URL update event after count update
            window.dispatchEvent(new CustomEvent('tagQueryCountUpdated', {
                detail: { overlayId, count }
            }));
        }
    },

    /**
     * Update visibility for a query
     */
    updateVisibility(overlayId, visible) {
        if (this.queries.has(overlayId)) {
            this.queries.get(overlayId).visible = visible;
            this.updateLegendDisplay();

            // Trigger URL update event after visibility change
            window.dispatchEvent(new CustomEvent('tagQueryVisibilityChanged', {
                detail: { overlayId, visible }
            }));
        }
    },

    /**
     * Get all visible queries
     */
    getVisibleQueries() {
        const allQueries = Array.from(this.queries.values());
        const visibleQueries = allQueries.filter(query => query.visible);
        return visibleQueries;
    },

    /**
     * Generate and display the legend - DISABLED
     */
    updateLegendDisplay() {
        // Legend display is disabled
    },

    /**
     * Create the legend container if it doesn't exist - DISABLED
     */
    createLegendContainer() {
        // Legend container creation is disabled
    },

    /**
     * Add CSS styles for the legend - DISABLED
     */
    addLegendStyles() {
        // Legend styles are disabled
    },
};

// Guard set to avoid re-running the same tag query multiple times concurrently
if (!window._runningTagQueries) window._runningTagQueries = new Set();

function executeTagQuery(key, value) {

    // Prevent duplicate concurrent executions for the same key/value
    try {
        const overlayKey = `tag_${key}_${value}`;
        if (window._runningTagQueries && window._runningTagQueries.has(overlayKey)) {
            return;
        }
        window._runningTagQueries.add(overlayKey);
    } catch (guardErr) {
        console.warn('Could not set running guard for executeTagQuery', guardErr);
    }

    /**
     * Check if this exact query is already running or exists - OPTIMIZED
     */
    const existingQuery = window.tagQueryLegend.queries.get(`tag_${key}_${value}`);

    if (existingQuery) {
        // Remove the existing query from legend
        window.tagQueryLegend.removeQuery(`tag_${key}_${value}`);
    }
    if (!window.map) {
        setTimeout(() => executeTagQuery(key, value), 500);
        return;
    }

    if (typeof window.map.getView !== 'function') {
        setTimeout(() => executeTagQuery(key, value), 500);
        return;
    }

    // Get current map bbox
    const view = window.map.getView();
    const extent = view.calculateExtent();
    const bbox = ol.proj.transformExtent(extent, view.getProjection(), 'EPSG:4326');

    // Validate bbox coordinates
    if (bbox.some(coord => isNaN(coord) || Math.abs(coord) > 180)) {
        console.error('Invalid bbox coordinates');
        $('#execute-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('invalidLocation') : 'Invalid Location'}`);
        return;
    }

    // Get element types from UI (default to all)
    const elementTypes = getSelectedElementTypes();
    console.log('🚀 Element types:', elementTypes);

    // Debug: Check current key and value
    console.log('🚀 Current key:', key, 'length:', key ? key.length : 'null');
    console.log('🚀 Current value:', value, 'length:', value ? value.length : 'null');
    console.log('🚀 Parameters - key:', key, 'value:', value);

    // Generate Overpass query
    const query = window.generateOverpassQuery(key, value, bbox, elementTypes);
    console.log('🚀 Generated query:', query);

    // Check if query generation failed
    if (!query) {
        console.error('🚀 Failed to generate query - check key, value, and bbox');
        $('#execute-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryFailed') : 'Query Failed'}`);
        return;
    }

    // Update button state
    $('#execute-query-btn').prop('disabled', true).text(`${window.getTranslation ? window.getTranslation('executing') : 'Executing...'}`);
    console.log('🚀 Button state updated to executing');

    // Show loading indicator
    if (window.loading) window.loading.show();

    // Record start time for performance measurement
    window.queryStartTime = performance.now();

    // Create overlay for results
    console.log('🚀 EXECUTING QUERY - About to call createTagOverlay');
    console.log('🚀 Query parameters:', { key, value, query: query ? query.substring(0, 100) + '...' : 'null' });
    createTagOverlay(key, value, query);

    // Dispatch tagQueryAdded event immediately after creating overlay
    console.log('🚀 Dispatching tagQueryAdded event from executeTagQuery');
    window.dispatchEvent(new CustomEvent('tagQueryAdded', {
        detail: { key, value, overlayId: `tag_${key}_${value}` }
    }));

    // Also update permalink directly after a short delay
    setTimeout(() => {
        if (window.updatePermalink) {
            window.updatePermalink();
        }
    }, 100);

    // Execute the query
    executeSingleQuery(query, 'tag-query')
        .then((features) => {
            console.log('🚀 Query executed successfully, features received:', features.length);
            processQueryResults(features, key, value);
        })
        .catch((error) => {
            console.error('🚀 Query execution failed:', error);
            // Hide loading indicator in case it's still showing
            if (window.loading) window.loading.hide();
            $('#execute-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryFailed') : 'Query Failed'}`);
            // Clear running guard on error
            try {
                const overlayId = `tag_${key}_${value}`;
                if (window._runningTagQueries && window._runningTagQueries.has(overlayId)) {
                    window._runningTagQueries.delete(overlayId);
                }
            } catch (delErr) {
                console.warn('Could not clear running guard on error', delErr);
            }
        });
}

function createTagOverlay(key, value, query) {
    // Generate unique color for this key-value pair (same as map uses for base color)
    const uniqueColor = generateQueryColor(key, value, false);

    // Create a unique overlay for this tag query
    const overlayId = `tag_${key}_${value}`;
    const overlayTitle = `${key}=${value}`;

    console.log('🎯 Creating overlay:', overlayId, overlayTitle);

    // Add to legend before creating the overlay
    console.log('🎯 ADDING TO LEGEND - BEFORE');
    console.log('🎯 tagQueryLegend exists:', !!window.tagQueryLegend);
    console.log('🎯 tagQueryLegend type:', typeof window.tagQueryLegend);
    console.log('🎯 tagQueryLegend queries before:', window.tagQueryLegend ? window.tagQueryLegend.queries.size : 'N/A');

    window.tagQueryLegend.addQuery(overlayId, key, value, uniqueColor, 0, true);

    console.log('🎯 ADDING TO LEGEND - AFTER');
    console.log('🎯 tagQueryLegend queries after:', window.tagQueryLegend ? window.tagQueryLegend.queries.size : 'N/A');
    console.log('🎯 tagQueryLegend queries content:', window.tagQueryLegend ? Array.from(window.tagQueryLegend.queries.entries()) : 'N/A');

    // Trigger URL update event instead of direct call
    console.log('🎯 Dispatching tagQueryAdded event');
    window.dispatchEvent(new CustomEvent('tagQueryAdded', {
        detail: { key, value, overlayId }
    }));

    // Create vector source without loader initially to prevent automatic queries
    const vectorSource = new ol.source.Vector({
        format: new ol.format.OSMXML(),
        // No loader here as we handle loading state in the query execution
        loader: function() {
            // Explicitly do nothing - loading is handled in executeTagQuery
            return null;
        }
    });

    // Set flag to indicate this is an explicit query request
    vectorSource._explicitQuery = true;

    // Create vector layer
    const vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        title: overlayTitle,
        id: overlayId,
        iconSrc: 'src/img/icones_web/tag_icon.png',
        iconStyle: 'filter: hue-rotate(120deg);',
        visible: true,
        style: function(feature) {
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType();

            console.log('🎨 Styling feature:', {
                type: geometryType,
                id: feature.getId()
            });

            // Style for nodes (Point geometries) - ORIGINAL ELEGANT STYLE
            if (geometryType === 'Point') {
                const originalType = feature.get('originalType');

                // Check if this point was originally a LineString
                if (originalType === 'LineString') {
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({
                                color: [...generateQueryColor(vectorLayer.get('id'), true), 0.65]
                            }),
                            stroke: new ol.style.Stroke({
                                color: [...generateQueryColor(vectorLayer.get('id'), true), 1.0],
                                width: 2
                            })
                        })
                    });
                }

                // Check if this point was originally a Polygon
                if (originalType === 'Polygon') {
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 6,
                            fill: new ol.style.Fill({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                            }),
                            stroke: new ol.style.Stroke({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 1.0],
                                width: 2
                            })
                        })
                    });
                }

                // Regular point styling (nodes)
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 4,
                        fill: new ol.style.Fill({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 0.6]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 1.0],
                            width: 1
                        })
                    })
                });
            }

            // Style for LineString geometries (ways) - show as lines
            if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
                const isFixed = feature.get('fixedGeometry');

                // Generate consistent random color based on overlay ID
                const overlayId = vectorLayer.get('id');
                const color = generateQueryColor(overlayId, isFixed);

                return new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: isFixed ? 3 : 4 // Thicker lines for better visibility
                    })
                });
            }

            // Style for Polygon geometries (areas) - show as filled areas
            if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
                try {
                    const area = geometry.getArea();
                    if (isNaN(area) || area <= 0) {
                        // Invalid polygon - show as point at centroid
                        console.warn('Invalid polygon, showing as point:', feature.getId());
                        const centroid = ol.extent.getCenter(geometry.getExtent());
                        return new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({
                                    color: [...generateQueryColor(vectorLayer.get('id'), false), 0.65] // 65% opacity for value queries
                                }),
                                stroke: new ol.style.Stroke({
                                    color: generateQueryColor(vectorLayer.get('id'), false),
                                    width: 2
                                })
                            }),
                            geometry: new ol.geom.Point(centroid)
                        });
                    }

                    // Valid polygon - show as filled area
                    return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: generateQueryColor(vectorLayer.get('id'), false), // Use same color as lines
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 0.65] // 65% opacity for value queries
                        })
                    });
                } catch (error) {
                    console.warn('Error styling polygon, showing as point:', error);
                    // Show as point at centroid as fallback
                    const centroid = ol.extent.getCenter(geometry.getExtent());
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 6,
                            fill: new ol.style.Fill({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                            }),
                            stroke: new ol.style.Stroke({
                                color: generateQueryColor(vectorLayer.get('id'), false),
                                width: 2
                            })
                        }),
                        geometry: new ol.geom.Point(centroid)
                    });
                }
            }

            // Fallback for any other geometry type - show as point
            console.warn('Unknown geometry type, showing as point:', geometryType);
            try {
                const centroid = ol.extent.getCenter(geometry.getExtent());
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                        }),
                        stroke: new ol.style.Stroke({
                            color: generateQueryColor(vectorLayer.get('id'), false),
                            width: 2
                        })
                    }),
                    geometry: new ol.geom.Point(centroid)
                });
            } catch (error) {
                console.error('Error creating fallback point:', error);
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 4,
                        fill: new ol.style.Fill({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 0.6]
                        }),
                        stroke: new ol.style.Stroke({
                            color: generateQueryColor(vectorLayer.get('id'), false),
                            width: 1
                        })
                    })
                });
            }
        }
    });

    // Set additional properties for overlay system integration
    vectorLayer.set('group', 'Tag Queries');
    vectorLayer.set('type', 'overlay');
    vectorLayer.set('title', overlayTitle);
    vectorLayer.set('id', overlayId);
    vectorLayer.set('iconSrc', 'src/img/icones_web/tag_icon.png');
    vectorLayer.set('iconStyle', 'filter: hue-rotate(120deg);');

    // Find or create the Tag Queries group and add the layer to it
    const tagQueriesGroup = findOrCreateTagOverlaysGroup();
    if (tagQueriesGroup) {
        // Check if this specific overlay already exists in the group - OPTIMIZED
        const existingLayers = tagQueriesGroup.getLayers().getArray();
        const existingOverlay = existingLayers.find(layer => layer.get('id') === overlayId);

        if (existingOverlay) {
            // Remove the existing overlay to allow fresh query
            tagQueriesGroup.getLayers().remove(existingOverlay);

            // Also remove from legend
            if (window.tagQueryLegend) {
                window.tagQueryLegend.removeQuery(overlayId);
            }
        }

        // Add the vector layer to the Tag Queries group
        tagQueriesGroup.getLayers().push(vectorLayer);
    }

    // If the map already exists, ensure the group is in it
    if (window.map) {
        const mapLayers = window.map.getLayers().getArray();
        const groupInMap = mapLayers.some(layer => layer === tagQueriesGroup);

        if (!groupInMap) {
            window.map.addLayer(tagQueriesGroup);
        }
    }
}

function initValueSearch() {
    // Wait for translations to be available
    if (typeof window.getTranslation !== 'function') {
        setTimeout(initValueSearch, 100);
        return;
    }

    const searchInput = $('#value-search');
    const resultsContainer = $('#value-search-dropdown');

    if (!searchInput.length) {
        console.error('Value search input not found!');
        return;
    }

    if (!resultsContainer.length) {
        console.error('Value search dropdown not found!');
        return;
    }

    let searchTimeout;
    let currentKey = null;
    let currentValue = null;
    let currentResults = [];

    // Listen for language changes to clear search results
    window.addEventListener('languageChanged', function(event) {
        console.log('🔄 Language changed, clearing search results');
        // Clear UI state
        searchInput.val('');
        resultsContainer.empty().hide();
        $('#execute-query-btn').hide();
        $('#clear-search-btn').hide();
        // Clear data
        searchInput.removeData('selectedKey');
        currentResults = [];
    });

    // Add event listeners for element type checkboxes
    $('.element-type-checkbox').on('change', function() {
        console.log('🔍 Element type checkbox changed, updating URL');
        if (window.updatePermalink) {
            window.updatePermalink();
        }
    });

    // Initialize search input
    searchInput.on('input', function() {
        const query = $(this).val().trim();

        // Get the selected key from key search
        const selectedKey = $(this).data('selectedKey');

        // Check if query is in key=value format and no key is selected
        let parsedKey = selectedKey;
        let parsedValue = query;

        if (!selectedKey && query.includes('=')) {
            // Try to parse key=value format
            const parts = query.split('=', 2);
            if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
                parsedKey = parts[0].trim();
                parsedValue = parts[1].trim();
                // Store the parsed key for later use
                $(this).data('selectedKey', parsedKey);
                $(this).val(parsedValue); // Update input to show only the value
            }
        }

        // Update current value and key for potential execution
        currentValue = parsedValue;

        // Show execute button if we have both key and value
        if (parsedKey && parsedValue) {
            showExecuteButton(parsedKey, parsedValue);
        } else {
            $('#execute-query-btn').hide();
            $('#clear-search-btn').hide();
        }

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Clear results if query is empty
        if (!parsedValue) {
            resultsContainer.empty().hide();
            return;
        }

        // Debounce search - use selected key if available
        searchTimeout = setTimeout(() => {
            performValueSearch(parsedValue, parsedKey);
        }, 300);
    });

    // Handle result selection
    resultsContainer.on('click', '.value-search-result', function() {
        let result = $(this).data('result');

        // If jQuery data didn't work, try the attribute
        if (!result) {
            const attrData = $(this).attr('data-result');
            if (attrData) {
                try {
                    result = JSON.parse(attrData);
                } catch (e) {
                    console.error('Failed to parse result attribute:', e);
                }
            }
        }

        // Check if this is a custom value option
        const customValue = $(this).attr('data-custom-value');
        if (customValue) {
            // Set current value and show execute button
            currentValue = customValue;
            if (currentKey) {
                // Store the selected key for custom values
                $('#value-search').data('selectedKey', currentKey);
                showExecuteButton(currentKey, currentValue);
            }
            resultsContainer.empty().hide();
            return;
        }

        if (result) {
            selectValueResult(result);
        } else {
            console.error('No result data found on clicked element');
        }
    });

    // Handle execute button click
    $('#execute-query-btn').on('click', function() {
        // Get key and value directly from input fields instead of global variables
        const selectedKey = $('#value-search').data('selectedKey');
        const valueInput = $('#value-search').val().trim();

        if (selectedKey && valueInput) {
            executeTagQuery(selectedKey, valueInput);
            const executingText = window.getTranslation ? window.getTranslation('executing') || 'Executing...' : 'Executing...';
            $(this).prop('disabled', true).text(executingText);
        } else {
            console.error('Execute button clicked but missing key or value');
        }
    });

    // Handle clear button click
    $('#clear-search-btn').on('click', function() {
        console.log('🧹 Clear button clicked - starting cleanup');

        // Clear UI state
        $('#value-search').val('');
        $('#value-search-dropdown').empty().hide();

        $('#execute-query-btn').hide().prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('executeQuery') : 'Execute Query'}`);
        $(this).hide();

        // Clear the selected key from value search
        $('#value-search').removeData('selectedKey');

        // Clear map layers (remove all tag query overlays)
        console.log('🧹 Calling clearMapLayers from clear button');
        try {
            const result = clearMapLayers();
            console.log('🧹 clearMapLayers returned:', result);
        } catch (error) {
            console.error('🧹 Error calling clearMapLayers:', error);
        }

        console.log('🧹 Clear button cleanup completed');
        // Add visual feedback
        alert('Clear completed - check console for details');
    });

    searchInput.on('keydown', function(e) {
        const highlighted = resultsContainer.find('.highlighted');

        switch(e.keyCode) {
            case 40: // Down arrow
                e.preventDefault();
                if (highlighted.length) {
                    highlighted.removeClass('highlighted').next().addClass('highlighted');
                } else {
                    resultsContainer.find('.value-search-result:first').addClass('highlighted');
                }
                break;
            case 38: // Up arrow
                e.preventDefault();
                if (highlighted.length) {
                    highlighted.removeClass('highlighted').prev().addClass('highlighted');
                } else {
                    resultsContainer.find('.value-search-result:last').addClass('highlighted');
                }
                break;
            case 13: // Enter
                e.preventDefault();
                if (highlighted.length) {
                    const result = highlighted.data('result');
                    if (result) {
                        selectValueResult(result);
                    } else {
                        console.error('No result data found on highlighted value element');
                    }
                } else if (currentResults.length > 0) {
                    // Select first result if none highlighted
                    selectValueResult(currentResults[0]);
                }
                break;
            case 27: // Escape
                resultsContainer.empty().hide();
                searchInput.blur();
                break;
        }
    });

    // Define performValueSearch as a global function
    window.performValueSearch = function(query, key, useYesCsv = false) {
        let results = []; // Initialize results variable

        try {
            // Read checkbox state (default false)
            const useYesCsv = $('#use-yes-csv-checkbox').is(':checked');

            // Choose appropriate loader/init function
            const ensureLoaded = useYesCsv ? window.initTaginfoAPIYes : window.initTaginfoAPI;
            const loadedFlag = useYesCsv ? (window.taginfoDataYes && window.taginfoDataYes.loaded) : (window.taginfoData && window.taginfoData.loaded);

            if (!loadedFlag) {
                console.log('Taginfo data for requested dataset not loaded, initializing...');
                if (ensureLoaded) {
                    ensureLoaded().then(() => {
                        console.log('Taginfo API (requested dataset) initialized, retrying search');
                        window.performValueSearch(query, key);
                    }).catch(error => {
                        console.error('Failed to initialize taginfo API for requested dataset:', error);
                    });
                } else {
                    console.error('No init function for requested taginfo dataset');
                }
                return;
            }

            results = window.searchValues(query, key, 100, useYesCsv);
            currentResults = results;

            // Check if displayValueResults exists before calling it
            if (typeof displayValueResults === 'function') {
                displayValueResults(results, query);
            } else {
                console.error('displayValueResults is not defined');
            }

            // Trigger custom event for other components
            searchInput.trigger('valueSearchResults', [results, key]);
        } catch (error) {
            console.error('Error in performValueSearch:', error);
        }
    }

    function displayValueResults(results, query) {
        resultsContainer.empty();

        if (results.length === 0) {
            // Show option to execute custom value
            const customValueOption = `
                <div class="value-search-result custom-value-option" data-custom-value="${escapeHtml(query)}">
                    <div class="value-name">"${escapeHtml(query)}"</div>
                    <div class="value-definition">${window.getTranslation ? window.getTranslation('customValueQuery') : 'Custom value - execute direct query'}</div>
                    <div class="value-count">${window.getTranslation ? window.getTranslation('clickToExecute') : 'Click to execute'}</div>
                </div>
            `;
            resultsContainer.append(customValueOption);
            resultsContainer.show();
            return;
        }

        results.forEach((result, index) => {
            let countToUse = result.countAll || result.totalCount || 0;
            if (typeof countToUse === 'string') {
                countToUse = parseInt(countToUse) || 0;
            }
            if (typeof countToUse !== 'number' || countToUse <= 0) {
                countToUse = 0;
            }
            let definitionToUse = result.definition_en || result.definition_ca || result.definition_es || result.definition || '';

            // For global value search results, we need to get the definition from the keys that use this value
            if (result.keys && result.keys.length > 0 && !definitionToUse) {
                // Try to get definition from the first key that uses this value
                const firstKey = result.keys[0];
                if (window.taginfoData.keys.has(firstKey)) {
                    const keyData = window.taginfoData.keys.get(firstKey);
                    if (keyData.values.has(result.value)) {
                        const valueData = keyData.values.get(result.value);
                        definitionToUse = valueData.definition_en || valueData.definition_ca || valueData.definition_es || valueData.definition || '';
                    }
                }
            }

            // Apply highlighting to search query
            const highlightedValue = highlightText(result.value || result.key || 'No value', query);
            const highlightedKey = result.key ? highlightText(result.key, query) : '';

            // Apply highlighting to all definition columns
            const highlightedDef = highlightText(result.definition || '', query);
            const highlightedDefEn = highlightText(result.definition_en || '', query);
            const highlightedDefCa = highlightText(result.definition_ca || '', query);
            const highlightedDefEs = highlightText(result.definition_es || '', query);

            // Debug the HTML structure
            const valueNameHtml = `<div class="value-name">${highlightedValue}</div>`;
            const valueKeyHtml = result.key ? `<div class="value-key">for key: ${highlightedKey}</div>` : '';
            const valueTagHtml = result.tag ? `<div class="value-tag">${escapeHtml(result.tag)}</div>` : '';

            // Show only definition columns that contain the search term (with diacritic normalization)
            const queryNormalized = removeDiacritics(query.toLowerCase());
            
            // Get current language and its definition
            const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'ca';
            const langDefinition = result[`definition_${currentLang}`] || '';
            
            // Always show main definition if it contains the search term
            const defHtml = result.definition && 
                removeDiacritics(result.definition.toLowerCase()).includes(queryNormalized)
                ? `<div class="value-definition">${highlightedDef}</div>`
                : '';
                
            // Only show language-specific definition if it's different from main definition and contains the search term
            const defEnHtml = 
                result.definition_en && 
                removeDiacritics(result.definition_en.toLowerCase()).includes(queryNormalized) &&
                result.definition_en !== result.definition
                    ? `<div class="value-definition-en">EN: ${highlightedDefEn}</div>`
                    : '';
                    
            const defCaHtml = 
                result.definition_ca && 
                removeDiacritics(result.definition_ca.toLowerCase()).includes(queryNormalized) &&
                result.definition_ca !== result.definition
                    ? `<div class="value-definition-ca">CA: ${highlightedDefCa}</div>`
                    : '';
                    
            const defEsHtml = 
                result.definition_es && 
                removeDiacritics(result.definition_es.toLowerCase()).includes(queryNormalized) &&
                result.definition_es !== result.definition
                    ? `<div class="value-definition-es">ES: ${highlightedDefEs}</div>`
                    : '';

            const valueCountHtml = `<div class="value-count">${formatValueCount(countToUse, definitionToUse)}</div>`;

            const html = `
                ${valueNameHtml}
                ${valueKeyHtml}
                ${valueTagHtml}
                ${defHtml}
                ${defEnHtml}
                ${defCaHtml}
                ${defEsHtml}
                ${valueCountHtml}
            `;

            const resultElement = $('<div>')
                .addClass('value-search-result')
                .attr('data-result', JSON.stringify(result))  // Store as attribute as well
                .data('result', result)
                .html(html);

            resultsContainer.append(resultElement);
        });

        resultsContainer.show();
    }

    function selectValueResult(result) {
        if (!result) {
            console.error('selectValueResult: result is undefined or null');
            return;
        }

        if (result.key && result.value) {
            // Key-value pair selected (from specific key search) - use the selected values
            $('#value-search').val(result.value);
            $('#value-search').data('selectedKey', result.key);
            resultsContainer.empty().hide();

            showExecuteButton(result.key, result.value);
        } else if (result.keys && result.keys.length > 0 && result.value) {
            // Value with multiple possible keys - use the first one and the selected value
            $('#value-search').val(result.value);
            $('#value-search').data('selectedKey', result.keys[0]);
            resultsContainer.empty().hide();

            showExecuteButton(result.keys[0], result.value);
        } else if (result.value) {
            // Just a value selected (no specific key) - use current key if available
            const currentKey = $('#value-search').data('selectedKey');
            if (!currentKey) {
                console.warn('No key available for value selection');
                return;
            }
            $('#value-search').val(result.value);
            resultsContainer.empty().hide();

            showExecuteButton(currentKey, result.value);
        } else {
            console.error('selectValueResult: result missing required properties:', result);
        }
    }

    function showExecuteButton(key, value) {
        const executeBtn = $('#execute-query-btn');
        const clearBtn = $('#clear-search-btn');

        executeBtn
            .show()
            .prop('disabled', false)
            .text(`${window.getTranslation ? window.getTranslation('executeQuery') : 'Execute Query'}: ${key}=${value}`);

        clearBtn.show();
    }

    function clearMapLayers() {
        console.log('🧹 Starting clearMapLayers function');

        if (!window.map) {
            console.log('🧹 No map available');
            return;
        }

        // Clear legend queries first
        if (window.tagQueryLegend && window.tagQueryLegend.queries) {
            console.log('🧹 Clearing legend queries:', window.tagQueryLegend.queries.size);
            window.tagQueryLegend.queries.clear();
        }

        // Find and remove all tag query layers from the map
        const mapLayers = window.map.getLayers();
        const allLayers = mapLayers.getArray();
        console.log('🧹 Total layers in map:', allLayers.length);

        // Collect layers to remove (avoid modifying array while iterating)
        const layersToRemove = [];

        allLayers.forEach((layer, index) => {
            const layerTitle = layer.get ? layer.get('title') : null;
            const layerId = layer.get ? layer.get('id') : null;
            const layerType = layer.get ? layer.get('type') : null;

            console.log(`🧹 Checking layer ${index}: title="${layerTitle}", id="${layerId}", type="${layerType}"`);

            // Check if this is a tag query layer or group
            if (layer.get && (
                layer.get('title') === 'Tag Queries' ||
                layer.get('title')?.includes('Tag Queries') ||
                layer.get('group') === 'Tag Queries' ||
                layer.get('type') === 'tag-query' ||
                (layer.get('id') && layer.get('id').startsWith('tag_'))
            )) {
                console.log(`🧹 Found tag query layer/group to remove: "${layerTitle}"`);
                layersToRemove.push(layer);
            }

            // Also check if this is a vector layer with query features
            if (layer instanceof ol.layer.Vector && layer.getSource) {
                const source = layer.getSource();
                if (source && source.getFeatures) {
                    const features = source.getFeatures();
                    const hasQueryFeatures = features.some(feature => {
                        // Check if any feature has properties that suggest it's from a query
                        const props = feature.getProperties();
                        return Object.keys(props).some(prop =>
                            !['geometry', 'id', 'type', 'originalType', 'fixedGeometry'].includes(prop)
                        );
                    });

                    if (hasQueryFeatures) {
                        console.log(`🧹 Found vector layer with query features to clear: "${layerTitle}"`);
                        source.clear();
                        layer.setVisible(false);
                    }
                }
            }
        });

        // Remove the collected layers
        layersToRemove.forEach(layer => {
            console.log(`🧹 Removing layer: "${layer.get('title')}"`);
            mapLayers.remove(layer);

            // If it's a group, also clear and remove all its sublayers
            if (layer.getLayers) {
                const subLayers = layer.getLayers().getArray();
                subLayers.forEach(subLayer => {
                    console.log(`🧹 Removing sublayer: "${subLayer.get('title')}"`);
                    if (subLayer instanceof ol.layer.Vector && subLayer.getSource) {
                        const source = subLayer.getSource();
                        if (source && typeof source.clear === 'function') {
                            source.clear();
                        }
                    }
                    layer.getLayers().remove(subLayer);
                });
            }
        });

        console.log(`🧹 Removed ${layersToRemove.length} layers/groups`);

        // Force immediate map re-render
        try {
            window.map.renderSync();
            console.log('🧹 Map re-rendered successfully');
        } catch (renderError) {
            console.warn('🧹 Error during map re-render:', renderError);
            window.map.render();
        }

        // Hide statistics after clearing
        hideQueryStatistics();

        console.log('🧹 clearMapLayers completed');
    }

    function executeSingleQuery(query, queryType, retryCount = 0) {
        return new Promise((resolve, reject) => {
            const client = new XMLHttpRequest();
            const apiUrl = retryCount > 0 ? config.overpassApiFallback() : config.overpassApi();
            client.open('POST', apiUrl);
            client.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
            client.timeout = 60000; // Increased timeout to 60 seconds
            
            // Hide loading indicator when request completes, regardless of success/failure
            client.onloadend = function() {
                if (window.loading) window.loading.hide();
            };

            client.onload = function() {
                if (client.status === 200) {
                    try {
                        const xmlDoc = $.parseXML(client.responseText);
                        const xml = $(xmlDoc);
                        const remark = xml.find('remark');

                        if (remark.length !== 0) {
                            console.error('Overpass error:', remark.text());
                            reject(new Error(`Overpass error: ${remark.text()}`));
                        } else {
                            const features = new ol.format.OSMXML().readFeatures(xmlDoc, {
                                featureProjection: window.map.getView().getProjection()
                            });
                            resolve(features);
                        }
                    } catch (parseError) {
                        console.error('Error parsing XML response:', parseError);
                        reject(parseError);
                    }
                } else {
                    console.error('Request failed with status:', client.status);
                    if (client.status === 504 || client.status === 429 || client.status >= 500) {
                        // Retry with fallback server if we haven't retried too many times
                        if (retryCount < 3) {
                            console.log(`Retrying with fallback server (attempt ${retryCount + 1}/3)...`);
                            setTimeout(() => {
                                executeSingleQuery(query, queryType, retryCount + 1)
                                    .then(resolve)
                                    .catch(reject);
                            }, 1000); // Wait 1 second before retry
                            return;
                        } else {
                            reject(new Error(`Timeout: All servers overloaded (${queryType} query)`));
                        }
                    } else {
                        reject(new Error(`HTTP ${client.status} (${queryType} query)`));
                    }
                }
            };

            client.onerror = function() {
                console.error('Network error');
                // Retry with fallback server if we haven't retried too many times
                if (retryCount < 3) {
                    console.log(`Retrying with fallback server due to network error (attempt ${retryCount + 1}/3)...`);
                    setTimeout(() => {
                        executeSingleQuery(query, queryType, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000); // Wait 1 second before retry
                    return;
                } else {
                    reject(new Error(`Network error - all servers failed (${queryType} query)`));
                }
            };

            client.ontimeout = function() {
                console.error('Request timed out');
                // Retry with fallback server if we haven't retried too many times
                if (retryCount < 3) {
                    console.log(`Retrying with fallback server due to timeout (attempt ${retryCount + 1}/3)...`);
                    setTimeout(() => {
                        executeSingleQuery(query, queryType, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000); // Wait 1 second before retry
                    return;
                } else {
                    reject(new Error(`Timeout: All servers overloaded (${queryType} query)`));
                }
            };

            client.send(query);
        });
    }

    function processQueryResults(allFeatures, key, value) {
        // Calculate execution time
        const endTime = performance.now();
        const executionTime = ((endTime - window.queryStartTime) / 1000).toFixed(3) + 's';

        // Fix invalid geometries
        const fixedFeatures = allFeatures.map((feature, index) => {
            const geometry = feature.getGeometry();
            const geometryType = geometry.getType();

            if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
                try {
                    const coords = geometry.getCoordinates();
                    if (!coords || coords.length < 2) {
                        if (!coords || coords.length === 0) {
                            const tinyLine = new ol.geom.LineString([[0, 0], [0.001, 0.001]]);
                            feature.setGeometry(tinyLine);
                            feature.set('fixedGeometry', true);
                        } else if (coords.length === 1) {
                            const point = coords[0];
                            const fixedCoords = [point, [point[0] + 0.001, point[1] + 0.001]];
                            const fixedLine = new ol.geom.LineString(fixedCoords);
                            feature.setGeometry(fixedLine);
                            feature.set('fixedGeometry', true);
                        }
                    }
                } catch (error) {
                    const tinyLine = new ol.geom.LineString([[0, 0], [0.001, 0.001]]);
                    feature.setGeometry(tinyLine);
                    feature.set('fixedGeometry', true);
                }
            }

            return feature;
        });

        // Filter valid features
        const validFeatures = fixedFeatures.filter((feature, index) => {
            const geometry = feature.getGeometry();
            if (!geometry || !geometry.getType()) {
                return false;
            }
            return true;
        });

        // Generate overlay info
        const overlayId = `tag_${key}_${value}`;
        const overlayTitle = `${key}=${value}`;
        const uniqueColor = generateQueryColor(overlayId, false); // Use overlayId for consistent colors

        // Create vector layer
        const vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                format: new ol.format.OSMXML(),
                loader: function() {
                    // Explicitly do nothing - loading is handled in executeTagQuery
                    return null;
                }
            }),
            title: overlayTitle,
            id: overlayId,
            iconSrc: 'src/img/icones_web/tag_icon.png',
            iconStyle: 'filter: hue-rotate(120deg);',
            visible: true,
            style: function(feature) {
                const geometry = feature.getGeometry();
                const geometryType = geometry.getType();

                if (geometryType === 'Point') {
                    const originalType = feature.get('originalType');
                    if (originalType === 'LineString') {
                        return new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 5,
                                fill: new ol.style.Fill({
                                    color: generateQueryColor(vectorLayer.get('id'), true)
                                }),
                                stroke: new ol.style.Stroke({
                                    color: generateQueryColor(vectorLayer.get('id'), true),
                                    width: 2
                                })
                            })
                        });
                    }
                    if (originalType === 'Polygon') {
                        return new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({
                                    color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                                }),
                                stroke: new ol.style.Stroke({
                                    color: generateQueryColor(vectorLayer.get('id'), false),
                                    width: 2
                                })
                            })
                        });
                    }
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 4,
                            fill: new ol.style.Fill({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 0.6]
                            }),
                            stroke: new ol.style.Stroke({
                                color: generateQueryColor(vectorLayer.get('id'), false),
                                width: 1
                            })
                        })
                    });
                }

                if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
                    const isFixed = feature.get('fixedGeometry');
                    const color = generateQueryColor(overlayId, false); // Use consistent color base

                    return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: color,
                            width: isFixed ? 3 : 4
                        })
                    });
                }

                if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
                    try {
                        const area = geometry.getArea();
                        if (isNaN(area) || area <= 0) {
                            const centroid = ol.extent.getCenter(geometry.getExtent());
                            return new ol.style.Style({
                                image: new ol.style.Circle({
                                    radius: 6,
                                    fill: new ol.style.Fill({
                                        color: [...generateQueryColor(vectorLayer.get('id'), false), 0.8]
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: generateQueryColor(vectorLayer.get('id'), false),
                                        width: 2
                                    })
                                }),
                                geometry: new ol.geom.Point(centroid)
                            });
                        }
                        return new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: generateQueryColor(vectorLayer.get('id'), false),
                                width: 2
                            }),
                            fill: new ol.style.Fill({
                                color: [...generateQueryColor(vectorLayer.get('id'), false), 0.05]
                            })
                        });
                    } catch (error) {
                        const centroid = ol.extent.getCenter(geometry.getExtent());
                        return new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 6,
                                fill: new ol.style.Fill({
                                    color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                                }),
                                stroke: new ol.style.Stroke({
                                    color: generateQueryColor(vectorLayer.get('id'), false),
                                    width: 2
                                })
                            }),
                            geometry: new ol.geom.Point(centroid)
                        });
                    }
                }

                const centroid = ol.extent.getCenter(geometry.getExtent());
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({
                            color: [...generateQueryColor(vectorLayer.get('id'), false), 0.4]
                        }),
                        stroke: new ol.style.Stroke({
                            color: generateQueryColor(vectorLayer.get('id'), false),
                            width: 2
                        })
                    }),
                    geometry: new ol.geom.Point(centroid)
                });
            }
        });

        // Set additional properties
        vectorLayer.set('group', 'Tag Queries');
        vectorLayer.set('type', 'overlay');
        vectorLayer.set('title', overlayTitle);
        vectorLayer.set('id', overlayId);
        vectorLayer.set('iconSrc', 'src/img/icones_web/tag_icon.png');
        vectorLayer.set('iconStyle', 'filter: hue-rotate(120deg);');

        // Add to legend
        window.tagQueryLegend.addQuery(overlayId, key, value, uniqueColor, 0, true);

        // Filter features with tags for display and statistics
        const featuresWithTags = validFeatures.filter(feature => {
            const properties = feature.getProperties();

            // Check if this feature has OSM tags (not metadata or internal properties)
            const internalProps = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry',
                                 'members', 'memberOf', 'member', 'membership', 'role'];
            const metadataProps = ['version', 'timestamp', 'changeset', 'user', 'uid', 'visible'];

            return Object.keys(properties).some(prop =>
                !internalProps.includes(prop) && !metadataProps.includes(prop)
            );
        });

        // Add features with tags to the map (for display)
        vectorLayer.getSource().addFeatures(featuresWithTags);

        // Update legend with correct count (only elements with tags)
        window.tagQueryLegend.updateCount(overlayId, featuresWithTags.length);

        // Update query statistics - COUNT ALL NODES, not just tagged ones
        const nodeStats = validFeatures.reduce((acc, feature) => {
            const geometryType = feature.getGeometry().getType();
            const properties = feature.getProperties();

            if (geometryType === 'Point') {
                // Check if this node has OSM tags (not metadata or internal properties)
                const hasOSMTags = Object.keys(properties).some(prop => {
                    // OSM tags are properties that describe the element's characteristics
                    // They should be key=value pairs like amenity, name, highway, etc.
                    // NOT structural properties or metadata

                    const systemProps = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry'];
                    const metadataProps = ['version', 'timestamp', 'changeset', 'user', 'uid', 'visible'];
                    const structuralProps = ['members', 'memberOf', 'member', 'membership', 'role'];

                    // A property is an OSM tag if it's NOT in any of these categories
                    return !systemProps.includes(prop) && !metadataProps.includes(prop) && !structuralProps.includes(prop);
                });

                if (hasOSMTags) {
                    acc.standaloneNodes = (acc.standaloneNodes || 0) + 1;
                } else {
                    acc.polygonNodes = (acc.polygonNodes || 0) + 1;
                }

                // Debug: Log properties of nodes to understand classification
                if (acc.standaloneNodes + acc.polygonNodes <= 3) { // Only log first few
                    const nonSystemProps = Object.keys(properties).filter(prop => {
                        const systemProps = ['geometry', 'id', 'type', 'originalType', 'fixedGeometry'];
                        const metadataProps = ['version', 'timestamp', 'changeset', 'user', 'uid', 'visible'];
                        const structuralProps = ['members', 'memberOf', 'member', 'membership', 'role'];
                        return !systemProps.includes(prop) && !metadataProps.includes(prop) && !structuralProps.includes(prop);
                    });
                    console.log(`🔍 Node ${acc.standaloneNodes + acc.polygonNodes}:`, {
                        hasOSMTags,
                        nonSystemProps,
                        totalProps: Object.keys(properties).length
                    });
                }
            } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
                acc.ways = (acc.ways || 0) + 1;
            } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
                acc.polygons = (acc.polygons || 0) + 1;
            }

            return acc;
        }, {});

        console.log('📊 Node statistics:', nodeStats);

    updateQueryStatistics({
        query: `${key}=${value}`,
        dataSize: formatBytes(allFeatures.length * 100), // Approximate data size
        executionTime: executionTime,
        nodes: nodeStats.standaloneNodes || 0,
        polygonNodes: nodeStats.polygonNodes || 0,
        ways: nodeStats.ways || 0,
        relations: nodeStats.polygons || 0,
        polygons: nodeStats.polygons || 0,
        color: uniqueColor
    });

        // Add vector layer to map
        const tagQueriesGroup = findOrCreateTagOverlaysGroup();
        if (tagQueriesGroup) {
            tagQueriesGroup.getLayers().push(vectorLayer);
            // Ensure the group is actually added to the map
            if (window.map) {
                const mapLayers = window.map.getLayers().getArray();
                if (!mapLayers.some(l => l === tagQueriesGroup)) {
                    console.log('🔍 Tag Queries group not present in map yet, adding it now');
                    window.map.addLayer(tagQueriesGroup);
                }
            }
        }

        // Dispatch events
        window.dispatchEvent(new CustomEvent('tagQueryAdded', {
            detail: { key, value, overlayId }
        }));

        // Clear running guard for this query so future executions are allowed
        try {
            if (window._runningTagQueries && window._runningTagQueries.has(overlayId)) {
                window._runningTagQueries.delete(overlayId);
                console.log('✅ Cleared running guard for', overlayId);
            }
        } catch (delErr) {
            console.warn('Could not clear running guard for', overlayId, delErr);
        }

        $('#execute-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryExecuted') : 'Query Executed'} - ${window.getTranslation ? window.getTranslation('clickToRepeat') : 'Click to Repeat'}`);
        $('#clear-search-btn').show();

        // If we added features, make sure they are visible: fit view to features and render
        try {
            const src = vectorLayer.getSource();
            const feats = src.getFeatures ? src.getFeatures() : [];
            console.log('🎯 Added features count for overlay', overlayId, ':', feats.length);

            // Ensure layer is visible and on top
            try {
                vectorLayer.setVisible(true);
                // Give it a high z-index so it renders above basemap/other overlays
                if (typeof vectorLayer.setZIndex === 'function') vectorLayer.setZIndex(1000);
            } catch (zErr) {
                console.warn('⚠️ Could not set zIndex on vector layer:', zErr);
            }

            if (feats.length > 0 && window.map) {
                const featuresExtent = src.getExtent();

                console.log('🎯 Features extent:', featuresExtent);

                // Validate extent numbers (must be finite and not empty)
                const isValidExtent = featuresExtent && !ol.extent.isEmpty(featuresExtent) &&
                    featuresExtent.every(coord => Number.isFinite(coord));

                if (isValidExtent) {
                    try {
                        const mapView = window.map.getView();
                        const mapSize = window.map.getSize();
                        const viewExtent = mapView.calculateExtent(mapSize);

                        // Only fit the view if the features extent is not already fully inside the current view
                        const needFit = !(ol.extent.containsExtent(viewExtent, featuresExtent));
                        console.log('🔎 View extent contains features extent?', ol.extent.containsExtent(viewExtent, featuresExtent), 'needFit:', needFit);

                        if (needFit) {
                            console.log('🔎 Fitting map view to new features extent for overlay', overlayId);
                            // Fit with padding and maxZoom to avoid zooming too far
                            mapView.fit(featuresExtent, { size: mapSize, maxZoom: 18, padding: [50, 50, 50, 50] });
                        } else {
                            console.log('🔎 Features already within view; skipping fit to avoid flash');
                        }
                    } catch (fitErr) {
                        console.warn('⚠️ Error fitting view to extent:', fitErr);
                    }
                } else {
                    console.warn('⚠️ Invalid features extent, skipping fit:', featuresExtent);
                }

                // Force synchronous render to ensure visibility
                try {
                    window.map.renderSync();
                } catch (rsErr) {
                    console.warn('⚠️ renderSync failed, calling render instead:', rsErr);
                    window.map.render();
                }
            }
        } catch (err) {
            console.error('🎯 Error while trying to show features on map:', err);
        }
    }

    function findOrCreateTagOverlaysGroup() {
        console.log('� Looking for Tag Queries group');

        // SINGLE CHECK: First check if group already exists in map (fastest)
        if (window.map) {
            const existingLayers = window.map.getLayers().getArray();
            for (let i = 0; i < existingLayers.length; i++) {
                const layer = existingLayers[i];
                if (layer.get && layer.get('type') === 'tag-query' && layer.get('title') === 'Tag Queries') {
                    console.log('� Found existing Tag Queries group in map');
                    return layer;
                }
            }
        }

        // SINGLE CHECK: If not in map, check config.layers (fallback)
        console.log('🔍 Checking config.layers for Tag Queries group');
        console.log('� Total layers in config:', config.layers.length);

        for (let i = 0; i < config.layers.length; i++) {
            const layer = config.layers[i];

            if (layer.get && layer.get('type') === 'tag-query' && layer.get('title') === 'Tag Queries') {
                console.log('🔍 Found existing Tag Queries group at index', i);

                // If map exists, ensure layer group is in it
                if (window.map && !window.map.getLayers().getArray().includes(layer)) {
                    console.log('🔍 Layer group not in map, adding it');
                    window.map.addLayer(layer);
                }
                return layer;
            }
        }

        // Create new group if not found
        console.log('🔍 Creating new Tag Queries group');

        const overlaysGroup = new ol.layer.Group({
            title: 'Tag Queries',
            type: 'tag-query',
            layers: []
        });

        overlaysGroup.set('originalTitle', 'Tag Queries');
        overlaysGroup.set('id', 'tag-queries-group');

        config.layers.push(overlaysGroup);

        if (window.map) {
            window.map.addLayer(overlaysGroup);
        }

        return overlaysGroup;
}

// Generate a consistent color based on overlay ID hash
function generateQueryColor(overlayId, isFixed = false) {
    // Generate a consistent color based on overlay ID hash
    let hash = 0;
    for (let i = 0; i < overlayId.length; i++) {
        const char = overlayId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Generate vibrant colors using HSL color space
    const hue = Math.abs(hash) % 360;
    const saturation = 70 + (Math.abs(hash * 7) % 20); // 70-90%
    const lightness = isFixed ? 45 : 55; // Slightly darker for fixed geometries

    // Convert HSL to RGB
    const hslToRgb = (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;
        if (s === 0) {
            r = g = b = l; // Achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    };

    return hslToRgb(hue, saturation, lightness);
}

    // formatDetailedCountWithNodeSeparation function moved to global scope

    // getSelectedElementTypes function moved to global scope

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // escapeHtml function moved to global scope
    // highlightText function moved to global scope

    // formatValueCount function moved to global scope

    // Listen for key selection from key search
    searchInput.on('keySelected', function(e, keyResult) {
        console.log('🔗 Key selected event received:', keyResult);
        // Store the selected key in the input field data
        searchInput.data('selectedKey', keyResult.key);
        // Clear value search and results
        searchInput.val('');
        resultsContainer.empty().hide();
    });

    // Hide results when clicking or touching outside
    $(document).on('click touchstart', function(e) {
        if (!$(e.target).closest('#value-search-container').length) {
            resultsContainer.empty().hide();
        }
    });

    // Hide statistics when clearing searches
    $('#clear-search-btn').on('click', function() {
        hideQueryStatistics();
    });

    // Expose clearMapLayers globally for use by overlay system
    window.clearMapLayers = clearMapLayers;

    // Query Statistics Functions

    // Hide statistics when clearing searches
    function hideQueryStatistics() {
        const statsContainer = $('#query-statistics');
        if (statsContainer.length > 0) {
            statsContainer.hide();
        }
    }
}
    // Initialize when DOM is ready
    $(document).ready(function() {
        // Wait for map to be ready
        const waitForMap = () => {
            if (window.map && typeof window.map.getView === 'function') {
                initValueSearch();
            } else {
                setTimeout(waitForMap, 100);
            }
        };

        waitForMap();
    });

// Export for use in other modules
window.initValueSearch = initValueSearch;
window.executeTagQuery = executeTagQuery;
window.tagQueryLegend = tagQueryLegend;
window.generateUniqueColor = generateUniqueColor; // Export for use in other modules
window.generateQueryColor = generateQueryColor; // Export for use in other modules
window.findOrCreateTagOverlaysGroup = findOrCreateTagOverlaysGroup; // Export for use in other modules
window.createTagOverlay = createTagOverlay; // Export for use in other modules
window.updateQueryStatistics = updateQueryStatistics; // Export for use in other modules
window.getSelectedElementTypes = getSelectedElementTypes; // Export for use in other modules
window.formatDetailedCount = formatDetailedCount; // Export for use in other modules
window.formatDetailedCountWithNodeSeparation = formatDetailedCountWithNodeSeparation; // Export for use in other modules
window.formatValueCount = formatValueCount; // Export for use in other modules
window.formatBytes = formatBytes; // Export for use in other modules
window.escapeHtml = escapeHtml; // Export for use in other modules
window.highlightText = highlightText; // Export for use in other modules
window.performValueSearch = performValueSearch; // Export for use in other modules
window.displayValueResults = displayValueResults; // Export for use in other modules
window.selectValueResult = selectValueResult; // Export for use in other modules
window.showExecuteButton = showExecuteButton; // Export for use in other modules
window.makeRequestWithRetry = makeRequestWithRetry; // Export for use in other modules
window.generateOverpassQuery = window.generateOverpassQuery; // Re-export for convenience
window.searchKeys = window.searchKeys; // Re-export for convenience
window.searchValues = window.searchValues; // Re-export for convenience
window.getTagDefinition = window.getTagDefinition; // Re-export for convenience
window.loadTaginfoDefinitions = window.loadTaginfoDefinitions; // Re-export for convenience
window.initTaginfoAPI = window.initTaginfoAPI; // Re-export for convenience
window.removeDiacritics = removeDiacritics; // Export for use in other modules
window.parseCSVLine = parseCSVLine; // Export for use in other modules
window.parseCSVData = parseCSVData; // Export for use in other modules
