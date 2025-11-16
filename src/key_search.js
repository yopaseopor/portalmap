/**
 * Key Search Implementation for OSM Tags
 */

function initKeySearch() {
    // console.log('🔑 initKeySearch called');

    // Wait for translations to be available
    if (typeof window.getTranslation !== 'function') {
        // console.log('🔑 Waiting for translations to be initialized...');
        setTimeout(initKeySearch, 100);
        return;
    }

    const searchInput = $('#key-search');
    const resultsContainer = $('#key-search-dropdown');

    // console.log('🔑 Key search input found:', searchInput.length);
    // console.log('🔑 Key search dropdown found:', resultsContainer.length);

    if (!searchInput.length) {
        console.error('🔑 Key search input not found!');
        return;
    }

    if (!resultsContainer.length) {
        console.error('🔑 Key search dropdown not found!');
        return;
    }

    let searchTimeout;
    let currentKey = null;
    let currentResults = [];

    // Initialize search input with debugging
    searchInput.on('input', function() {
        const query = $(this).val().trim();
        // console.log('🔑 Key search input:', query);

        // Store current key for potential generic query execution
        if (query) {
            currentKey = query;
            showKeyExecuteButton(query);

            // Synchronize with value search - set the key for value queries
            const valueSearchInput = $('#value-search');
            if (valueSearchInput.length) {
                // console.log('🔗 Syncing key with value search:', query);
                valueSearchInput.data('selectedKey', query);
            }
        } else {
            $('#execute-key-query-btn').hide();
            $('#clear-key-search-btn').hide();

            // Clear the selected key from value search when key search is empty
            const valueSearchInput = $('#value-search');
            if (valueSearchInput.length) {
                valueSearchInput.removeData('selectedKey');
            }
        }

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Clear results if query is empty
        if (!query) {
            resultsContainer.empty().hide();
            return;
        }

        // Debounce search
        searchTimeout = setTimeout(() => {
            console.log('🔑 Performing key search for:', query);
            performKeySearch(query);
        }, 300);
    });

    // Handle result selection
    resultsContainer.on('click', '.key-search-result', function() {
        const result = $(this).data('result');
        console.log('🔑 Clicked key result data:', result);
        if (result) {
            selectKeyResult(result);
        } else {
            console.error('🔑 No result data found on clicked key element');
        }
    });

    // Handle keyboard navigation
    searchInput.on('keydown', function(e) {
        const highlighted = resultsContainer.find('.highlighted');

        switch(e.keyCode) {
            case 40: // Down arrow
                e.preventDefault();
                if (highlighted.length) {
                    highlighted.removeClass('highlighted').next().addClass('highlighted');
                } else {
                    resultsContainer.find('.key-search-result:first').addClass('highlighted');
                }
                break;
            case 38: // Up arrow
                e.preventDefault();
                if (highlighted.length) {
                    highlighted.removeClass('highlighted').prev().addClass('highlighted');
                } else {
                    resultsContainer.find('.key-search-result:last').addClass('highlighted');
                }
                break;
            case 13: // Enter
                e.preventDefault();
                if (highlighted.length) {
                    const result = highlighted.data('result');
                    console.log('🔑 Enter key result data:', result);
                    if (result) {
                        selectKeyResult(result);
                    } else {
                        console.error('🔑 No result data found on highlighted key element');
                    }
                }
                break;
            case 27: // Escape
                resultsContainer.empty().hide();
                searchInput.blur();
                break;
        }
    });

    function performKeySearch(query) {
        // console.log('🔑 performKeySearch called with:', query);
        // console.log('🔑 taginfoData.loaded:', window.taginfoData.loaded);

        if (!window.taginfoData.loaded) {
            // console.log('🔑 Taginfo data not loaded, initializing...');
            window.initTaginfoAPI().then(() => {
                // console.log('🔑 Taginfo API initialized, retrying search');
                performKeySearch(query);
            }).catch(error => {
                console.error('🔑 Failed to initialize taginfo API:', error);
            });
            return;
        }

        // console.log('🔑 Searching for keys with query:', query);
        // console.log('🔑 Available keys in map:', window.taginfoData.keys.size);

        const results = window.searchKeys(query, 10);
        // console.log('🔑 Key search results:', results);
        displayKeyResults(results, query);

        // Trigger custom event for other components
        searchInput.trigger('keySearchResults', [results]);
    }

    function displayKeyResults(results, query) {
        // console.log('🔑 displayKeyResults called with:', results.length, 'results');
        resultsContainer.empty();

        if (results.length === 0) {
            // console.log('🔑 No results to display');
            resultsContainer.append(`<div class="no-results">${window.getTranslation ? window.getTranslation('noKeysFound') : 'No keys found'}</div>`);
            resultsContainer.show();
            return;
        }

        // console.log('🔑 Displaying results...');
        results.forEach((result, index) => {
            // console.log('🔑 Result', index, ':', result.key);

            // Find which definition contains the search term to show the most relevant one
            let bestDefinition = result.definition_en || result.definition_ca || result.definition_es || result.definition || `${window.getTranslation ? window.getTranslation('noDescriptionAvailable') : 'No description available'}`;
            const queryLower = query.toLowerCase();

            if (result.definition_en && result.definition_en.toLowerCase().includes(queryLower)) {
                bestDefinition = result.definition_en;
            } else if (result.definition_ca && result.definition_ca.toLowerCase().includes(queryLower)) {
                bestDefinition = result.definition_ca;
            } else if (result.definition_es && result.definition_es.toLowerCase().includes(queryLower)) {
                bestDefinition = result.definition_es;
            }

            const resultElement = $('<div>')
                .addClass('key-search-result')
                .data('result', result)
                .html(`
                    <div class="key-name">${escapeHtml(result.key)}</div>
                    <div class="key-definition">${escapeHtml(bestDefinition)}</div>
                    <div class="key-count">${formatKeyCount(result.totalCount, bestDefinition)}</div>
                `);

            // Append value suggestions (if available in taginfoData)
            try {
                const keyData = window.taginfoData && window.taginfoData.keys && window.taginfoData.keys.get(result.key);
                if (keyData && keyData.values && keyData.values.size > 0) {
                    // Build a small list of top values sorted by total count
                    const valueCounts = [];
                    for (const [v, entries] of keyData.values) {
                        // Sum counts for duplicate entries
                        let total = 0;
                        for (const e of entries) total += (e.countAll || 0);
                        valueCounts.push({ value: v, total });
                    }

                    // Sort descending by count, put '*' and empty values first so they're visible
                    valueCounts.sort((a, b) => {
                        if (a.value === '*' && b.value !== '*') return -1;
                        if (b.value === '*' && a.value !== '*') return 1;
                        if (!a.value && b.value) return -1;
                        if (!b.value && a.value) return 1;
                        return b.total - a.total;
                    });

                    const maxVals = 6;
                    const valsHtml = valueCounts.slice(0, maxVals).map(vc => {
                        const display = vc.value === '*' ? '*' : (vc.value === '' ? '(empty)' : escapeHtml(vc.value));
                        return `<button class="kv-btn" data-key="${escapeHtml(result.key)}" data-value="${escapeHtml(vc.value)}">${display} <span class=\"kv-count\">${formatNumber(vc.total)}</span></button>`;
                    }).join(' ');

                    const valuesContainer = $(`<div class="key-values">${valsHtml}</div>`);
                    resultElement.append(valuesContainer);
                }
            } catch (err) {
                console.error('🔑 Error building value suggestions for key', result.key, err);
            }

            resultsContainer.append(resultElement);
        });

        resultsContainer.show();
    }

    function selectKeyResult(result) {
        console.log('🔑 selectKeyResult called with:', result);

        if (!result) {
            console.error('🔑 selectKeyResult: result is undefined or null');
            return;
        }

        if (result.key) {
            currentKey = result.key; 
            searchInput.val(result.key);
            resultsContainer.empty().hide();

            const valueSearchInput = $('#value-search');
            if (valueSearchInput.length) {
                valueSearchInput.data('selectedKey', result.key);
                valueSearchInput.trigger('keySelected', [result]);
            }

            showKeyExecuteButton(result.key);

            console.log('✅ Key selected:', result.key);
        } else {
            console.error('🔑 selectKeyResult: result missing key property:', result);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function formatKeyCount(count, definition) {
        if (count > 0) {
            const formatted = `${formatNumber(count)} uses`;
            return formatted;
        } else {
            const shortDesc = definition ? definition.substring(0, 60) + (definition.length > 60 ? '...' : '') : `${window.getTranslation ? window.getTranslation('noDescriptionAvailable') : 'No description available'}`;
            return shortDesc;
        }
    }

    // Handle execute button click for generic key queries
    $('#execute-key-query-btn').on('click', function() {
        if (currentKey) {
            const $btn = $(this);
            const executingText = window.getTranslation ? window.getTranslation('executingQuery') || 'Executing query...' : 'Executing query...';
            $btn.prop('disabled', true).text(executingText);
            executeGenericKeyQuery(currentKey);
        }
    });

    // Handle clicks on value suggestion buttons inside results
    resultsContainer.on('click', '.kv-btn', function(e) {
        e.stopPropagation();
        const key = $(this).data('key');
        const value = $(this).data('value');
        console.log('🔑 Value suggestion clicked:', key, value);
        currentKey = `${key}${value && value !== '*' ? '=' + value : (value === '*' ? '=*' : '')}`;
        $('#key-search').val(key + (value && value !== '*' ? '=' + value : (value === '*' ? '=*' : '')));
        showKeyExecuteButton(currentKey);
        const $btn = $('#execute-key-query-btn');
        const executingText = window.getTranslation ? window.getTranslation('executingQuery') || 'Executing query...' : 'Executing query...';
        $btn.prop('disabled', true).text(executingText);
        executeGenericKeyQuery(currentKey);
    });

    // Handle clear button click
    $('#clear-key-search-btn').on('click', function() {
        console.log('🧹 Key search clear button clicked');

        currentKey = null;
        currentResults = [];

        searchInput.val('');
        resultsContainer.empty().hide();

        $('#execute-key-query-btn').hide().prop('disabled', false).text('Execute Key Query');
        $(this).hide();

        console.log('✅ Key search cleared');
    });

    function showKeyExecuteButton(key) {
        const executeBtn = $('#execute-key-query-btn');
        const clearBtn = $('#clear-key-search-btn');

        executeBtn
            .show()
            .prop('disabled', false)
            .text(`${window.getTranslation ? window.getTranslation('executeKeyQuery') : 'Execute Key Query'}: ${key}`);

        clearBtn.show();
    }

    function executeGenericKeyQuery(keyOrKeyValue) {
        let key = keyOrKeyValue;
        let value = null;

        if (keyOrKeyValue.includes('=')) {
            const parts = keyOrKeyValue.split('=');
            key = parts[0];
            value = parts[1] || '';  
        }

        if (!window.map) {
            setTimeout(() => executeGenericKeyQuery(keyOrKeyValue), 500);
            return;
        }

        if (typeof window.map.getView !== 'function') {
            setTimeout(() => executeGenericKeyQuery(keyOrKeyValue), 500);
            return;
        }

        console.log('🚀 Map is ready, getting bbox');

        // Get current map bbox
        const view = window.map.getView();
        const extent = view.calculateExtent();
        const bbox = ol.proj.transformExtent(extent, view.getProjection(), 'EPSG:4326');

        console.log('🚀 Map extent:', extent);
        console.log('🚀 Map projection:', view.getProjection());
        console.log('🚀 Map bbox:', bbox);
        console.log('🚀 Bbox formatted:', `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`);

        // Validate bbox coordinates
        if (bbox.some(coord => isNaN(coord) || Math.abs(coord) > 180)) {
            console.error('🚀 Invalid bbox coordinates:', bbox);
            $('#execute-key-query-btn').prop('disabled', false).text('Invalid Location');
            return;
        }

        // Get element types from UI (default to all)
        const elementTypes = ['node', 'way', 'relation']; // For generic key queries, search all types
        console.log('🚀 Element types:', elementTypes);

    // Generate query: if value is null => generic key query, else key=value
    const query = window.generateOverpassQuery(key, value, bbox, elementTypes);
        console.log('🚀 Generated generic key query:', query);

        // Check if query generation failed
        if (!query) {
            console.error('🚀 Failed to generate query - check key and bbox');
            $('#execute-key-query-btn').prop('disabled', false).text('Query Failed');
            return;
        }

        // Update button state
        const executingText = window.getTranslation ? window.getTranslation('executing') || 'Executing...' : 'Executing...';
        $('#execute-key-query-btn').prop('disabled', true).text(executingText);
        console.log('🚀 Button state updated to executing');

        // Create overlay for results (pass key and value so overlay id/name can reflect value)
        createGenericKeyOverlay(key, value, query);
    }

    function createGenericKeyOverlay(key, value, query) {
        console.log('🎯 createGenericKeyOverlay called with:', key, value);
        console.log('🎯 Query:', query);

        // Generate unique color for this key/value combination
        const uniqueColor = generateUniqueColor(key, value || 'generic');
        console.log('🎯 Generated unique color:', uniqueColor);

        // Sanitize value for id
        const safeValue = value ? String(value).replace(/[^a-z0-9]/gi, '_') : 'any';
        // Create a unique overlay id that includes key and value (or 'any' if generic)
        const overlayId = `key_${key}_${safeValue}`;
        const overlayTitle = value ? `Tag: ${key}=${value}` : `Key: ${key}`;

        console.log('🎯 Creating generic key overlay:', overlayId, overlayTitle);

        // Add to legend before creating the overlay
        window.tagQueryLegend.addQuery(overlayId, key, value, uniqueColor, 0, true);

        // Create vector source for the query with retry mechanism
        const vectorSource = new ol.source.Vector({
            format: new ol.format.OSMXML2(),
            loader: function (extent, resolution, projection) {
                console.log('🎯 Vector loader called');
                // Show loading indicator
                if (window.loading) window.loading.show();

                makeRequestWithRetry.call(this, query, 3, 2000); // 3 retries, 2 second delay

                function makeRequestWithRetry(queryData, maxRetries, delayMs) {
                    const client = new XMLHttpRequest();
                    client.open('POST', config.overpassApi());
                    client.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
                    client.timeout = 15000; // 15 second timeout for retries
                    console.log('🎯 Sending request to:', config.overpassApi());
                    console.log('🎯 Request data:', queryData);

                    client.ontimeout = function () {
                        console.error('🎯 Request timed out after 15 seconds');
                        if (maxRetries > 0) {
                            console.log('🎯 Retrying request in', delayMs, 'ms...');
                            setTimeout(() => makeRequestWithRetry.call(this, queryData, maxRetries - 1, delayMs), delayMs);
                        } else {
                            if (window.loading) window.loading.hide();
                            $('#execute-key-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryTimeout') : 'Query Timeout'}`);
                        }
                    }.bind(this);

                    client.onloadend = function () {
                        console.log('🎯 Request ended, status:', client.status);
                        if (window.loading) window.loading.hide();
                    }.bind(this);

                    client.onerror = function () {
                        console.error('🎯 Error loading tag data:', client.status, client.statusText);
                        if (maxRetries > 0) {
                            console.log('🎯 Retrying request in', delayMs, 'ms...');
                            setTimeout(() => makeRequestWithRetry.call(this, queryData, maxRetries - 1, delayMs), delayMs);
                        } else {
                            $('#execute-key-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryFailed') : 'Query Failed'}`);
                        }
                    }.bind(this);

                    client.onload = function () {
                        console.log('🎯 Request loaded, status:', client.status);
                        console.log('🎯 Response text length:', client.responseText.length);
                        if (client.status === 200) {
                            try {
                                const xmlDoc = $.parseXML(client.responseText);
                                const xml = $(xmlDoc);
                                const remark = xml.find('remark');

                                console.log('🎯 Parsed XML, looking for remark elements:', remark.length);

                                if (remark.length !== 0) {
                                    console.error('🎯 Overpass error:', remark.text());
                                    $('<div>').html(remark.text()).dialog({
                                        modal: true,
                                        title: 'Error',
                                        close: function () {
                                            $(this).dialog('destroy');
                                        }
                                    });
                                    $('#execute-key-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryError') : 'Query Error'}`);
                                } else {
                                    console.log('🎯 No errors found, parsing features...');
                                    const features = new ol.format.OSMXML2().readFeatures(xmlDoc, {
                                        featureProjection: window.map.getView().getProjection()
                                    });

                                    console.log('🎯 Features parsed successfully:', features.length);
                                    console.log('🎯 Sample feature:', features[0] ? {
                                        type: features[0].getGeometry().getType(),
                                        id: features[0].getId()
                                    } : 'No features');

                                    // Count elements by type
                                    const elementCounts = {
                                        node: 0,
                                        way: 0,
                                        relation: 0,
                                        polygon: 0
                                    };

                                    features.forEach(feature => {
                                        // Get the feature type from the OSM XML properties
                                        const properties = feature.getProperties();
                                        const type = feature.get('type') || 
                                                   (properties.tags && properties.tags.type) || 
                                                   (properties.get && properties.get('tags') && properties.get('tags').type) ||
                                                   (feature.getGeometry() ? feature.getGeometry().getType().toLowerCase() : 'unknown');
                                        
                                        console.log('🔍 Feature type detected:', type, 'Feature ID:', feature.getId());
                                        
                                        if (type === 'node' || (feature.getGeometry() && feature.getGeometry().getType() === 'Point')) {
                                            elementCounts.node++;
                                        } else if (type === 'way' || 
                                                  (feature.getGeometry() && 
                                                   (feature.getGeometry().getType() === 'LineString' || 
                                                    feature.getGeometry().getType() === 'Polygon'))) {
                                            elementCounts.way++;
                                            // Check if it's a polygon (closed way)
                                            const geometry = feature.getGeometry();
                                            if (geometry && geometry.getType() === 'Polygon') {
                                                elementCounts.polygon++;
                                            }
                                        } else if (type === 'relation') {
                                            elementCounts.relation++;
                                        } else {
                                            // Fallback: Check geometry type if type property is not available
                                            const geomType = feature.getGeometry() ? feature.getGeometry().getType().toLowerCase() : 'unknown';
                                            if (geomType === 'point' || geomType === 'multipoint') {
                                                elementCounts.node++;
                                            } else if (geomType === 'linestring' || geomType === 'multilinestring') {
                                                elementCounts.way++;
                                            } else if (geomType === 'polygon' || geomType === 'multipolygon') {
                                                elementCounts.way++;
                                                elementCounts.polygon++;
                                            } else if (type === 'node') {
                                                elementCounts.node++;
                                            } else if (type === 'way') {
                                                elementCounts.way++;
                                            } else if (type === 'relation') {
                                                elementCounts.relation++;
                                            } else {
                                                console.warn('⚠️ Unknown feature type:', type, feature);
                                            }
                                        }
                                    });
                                    
                                    console.log('📊 Element counts:', elementCounts);

                                    this.addFeatures(features);
                                    console.log('🎯 Features added to source');

                                    // Update legend with actual count
                                    window.tagQueryLegend.updateCount(overlayId, features.length);

                                    // Update query statistics
                                    if (window.updateQueryStatistics) {
                                        // Ensure the statistics container is visible
                                        const statsContainer = $('#query-statistics');
                                        if (statsContainer.length) {
                                            statsContainer.show();
                                            
                                            // Update the statistics display directly
                                            $('#execution-time').text('0.000s');
                                            $('#nodes-count').text(elementCounts.node.toString());
                                            $('#ways-count').text(elementCounts.way.toString());
                                            $('#relations-count').text(elementCounts.relation.toString());
                                            
                                            // Also update any other UI elements that might be showing these values
                                            if ($('#polygon-nodes-count').length) {
                                                $('#polygon-nodes-count').text('0');
                                            }
                                            if ($('#polygons-count').length) {
                                                $('#polygons-count').text(elementCounts.polygon.toString());
                                            }
                                            if ($('#data-size').length) {
                                                $('#data-size').text(window.formatBytes(features.length * 100));
                                            }
                                            
                                            // Add color indicators
                                            $('.stat-value').removeClass('color-indicator');
                                            $('#execution-time, #data-size, #nodes-count, #polygon-nodes-count, #ways-count, #relations-count, #polygons-count')
                                                .addClass('color-indicator')
                                                .css('background-color', `rgba(${uniqueColor[0]}, ${uniqueColor[1]}, ${uniqueColor[2]}, 0.1)`)
                                                .css('border-left', `3px solid rgb(${uniqueColor[0]}, ${uniqueColor[1]}, ${uniqueColor[2]})`);
                                        }
                                        
                                        // Also call the update function for consistency
                                        window.updateQueryStatistics({
                                            dataSize: window.formatBytes(features.length * 100), // Approximate size
                                            executionTime: '0.000s',
                                            nodes: elementCounts.node,
                                            polygonNodes: 0, // Not tracked separately for key searches
                                            ways: elementCounts.way,
                                            relations: elementCounts.relation,
                                            polygons: elementCounts.polygon,
                                            color: uniqueColor.slice(0, 3) // RGB values
                                        });
                                        
                                        console.log('📊 Updated query statistics with:', {
                                            nodes: elementCounts.node,
                                            ways: elementCounts.way,
                                            relations: elementCounts.relation,
                                            polygons: elementCounts.polygon
                                        });
                                    }

                                    // Update overlay summary if function exists
                                    if (window.updateOverlaySummary) {
                                        window.updateOverlaySummary();
                                    }

                                    // Trigger event for overlay management
                                    window.dispatchEvent(new CustomEvent('tagOverlayLoaded', {
                                        detail: { key, value: value || null, overlayId, featureCount: features.length }
                                    }));

                                    // Trigger the overlay features loaded event
                                    window.dispatchEvent(new CustomEvent('overlayFeaturesLoaded'));

                                    $('#execute-key-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('queryExecuted') : 'Query Executed'}`);
                                    $('#clear-key-search-btn').show();

                                    // Force a map render update to ensure visibility
                                    if (window.map) {
                                        console.log('🔍 Forcing map render update');
                                        window.map.render();
                                    }
                                }
                            } catch (parseError) {
                                console.error('🎯 Error parsing XML response:', parseError);
                                console.error('🎯 Response text preview:', client.responseText.substring(0, 500));
                                $('#execute-key-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('parseError') : 'Parse Error'}`);
                            }
                        } else {
                            console.error('🎯 Request failed with status:', client.status);
                            console.error('🎯 Response text:', client.responseText);
                            $('#execute-key-query-btn').prop('disabled', false).text(`${window.getTranslation ? window.getTranslation('requestFailed') : 'Request Failed'}`);
                        }
                    }.bind(this);
                    client.send(queryData);
                }
            },
            // Remove loading strategy to prevent automatic queries on map move/zoom
            // strategy: ol.loadingstrategy.bbox
        });

        // Create vector layer
        const vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            title: overlayTitle,
            id: overlayId,
            iconSrc: 'src/img/icones_web/tag_icon.png',
            iconStyle: 'filter: hue-rotate(120deg);',
            visible: true,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 4,
                    fill: new ol.style.Fill({
                        color: [...uniqueColor, 0.7]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [...uniqueColor, 1],
                        width: 1
                    })
                }),
                stroke: new ol.style.Stroke({
                    color: [...uniqueColor, 1],
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: [...uniqueColor, 0.3]
                })
            })
        });

        // Set additional properties for overlay system integration
        vectorLayer.set('group', 'Tag Queries');
        vectorLayer.set('type', 'tag-query');

        // Add to overlays group if it exists, otherwise create one
        const overlaysGroup = findOrCreateTagOverlaysGroup();
        console.log('🔍 Adding vector layer to group');
        console.log('🔍 Overlays group title:', overlaysGroup.get('title'));
        console.log('🔍 Overlays group type:', overlaysGroup.get('type'));

        // Add the layer to the group - the group already has layers array in constructor
        const layersCollection = overlaysGroup.getLayers();

        // Check if this overlay already exists in the group
        const existingLayer = layersCollection.getArray().find(layer =>
            layer.get && layer.get('id') === overlayId
        );

        if (existingLayer) {
            console.log('🔍 Overlay already exists in group, allowing re-execution');
            // Update button to allow re-execution
            const $btn = $('#execute-key-query-btn');
            const reexecuteText = window.getTranslation ? window.getTranslation('reexecuteQuery') || 'Re-execute Query' : 'Re-execute Query';
            $btn.prop('disabled', false).text(reexecuteText);
            // Don't update count here - it will be updated when features are loaded
            return;
        }

        layersCollection.push(vectorLayer);
        console.log('🔍 Vector layer added to group, total layers:', layersCollection.getLength());

        // If the map already exists, we need to add the layer group to it
        if (window.map) {
            console.log('🔍 Adding layer group to existing map');
            console.log('🔍 Current map layers before:', window.map.getLayers().getLength());
            // Check if the layer group is already in the map
            const existingLayers = window.map.getLayers().getArray();
            const existingTagGroups = existingLayers.filter(layer =>
                layer.get && layer.get('title') === 'Tag Queries' && layer.get('type') === 'tag-query'
            );

            console.log('🔍 Found existing Tag Queries groups:', existingTagGroups.length);

            if (existingTagGroups.length > 1) {
                console.log('🔍 Multiple Tag Queries groups found, removing extras');
                // Remove extra groups
                existingTagGroups.slice(1).forEach(group => {
                    window.map.removeLayer(group);
                    console.log('🔍 Removed extra Tag Queries group');
                });
            }

            const groupExists = existingLayers.some(layer => layer === overlaysGroup);

            console.log('🔍 Group exists in map:', groupExists);

            if (!groupExists) {
                console.log('🔍 Layer group not in map, adding it');
                window.map.addLayer(overlaysGroup);
                console.log('🔍 Layer group added, total map layers now:', window.map.getLayers().getLength());

                // Verify the group was actually added
                const verifyLayers = window.map.getLayers().getArray();
                const verifyGroupExists = verifyLayers.some(layer => layer === overlaysGroup);
                console.log('🔍 Verification - Group exists in map after add:', verifyGroupExists);
            } else {
                console.log('🔍 Layer group already exists in map');
            }
        } else {
            console.warn('🔍 Window.map is not available');
        }

        // Make sure the overlay group is visible
        overlaysGroup.setVisible(true);
        vectorLayer.setVisible(true);
        console.log('🔍 Overlay group visible:', overlaysGroup.getVisible());
        console.log('🔍 Vector layer visible:', vectorLayer.getVisible());

        console.log('🔍 Vector layer added, group layers count:', overlaysGroup.getLayers().getLength());

        // Trigger overlay update event to refresh the UI
        window.dispatchEvent(new Event('overlaysUpdated'));

        // Also trigger a more specific event for the overlay system
        window.dispatchEvent(new CustomEvent('overlayFeaturesLoaded'));

        // Reset button state
        $('#execute-key-query-btn').prop('disabled', false).text('Query Executed');
        $('#clear-key-search-btn').show();

        // Force a map render update to ensure visibility
        if (window.map) {
            console.log('🔍 Forcing map render update');
            window.map.render();
        }
    }

    function generateUniqueColor(key, value) {
        // Create a simple hash from the key-value combination
        const combined = `${key}:${value || 'generic'}`;
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

    function findOrCreateTagOverlaysGroup() {
        console.log('🔍 Looking for Tag Queries group');

        // First, try to find existing Tag Queries group
        console.log('🔍 Checking config.layers for Tag Queries group');
        console.log('🔍 Total layers in config:', config.layers.length);

        for (let i = 0; i < config.layers.length; i++) {
            const layer = config.layers[i];
            console.log('🔍 Checking layer', i, ':', layer.get ? layer.get('title') : 'no title', layer.get ? layer.get('type') : 'no type');

            if (layer.get && layer.get('type') === 'tag-query' && layer.get('title') === 'Tag Queries') {
                console.log('🔍 Found existing Tag Queries group at index', i);
                console.log('🔍 Group layers count:', layer.getLayers().getLength());

                // If the map already exists, make sure the layer group is in it
                if (window.map) {
                    console.log('🔍 Checking if layer group is in map');
                    const existingLayers = window.map.getLayers().getArray();
                    const groupExists = existingLayers.some(existingLayer => existingLayer === layer);
                    console.log('🔍 Group exists in map:', groupExists);

                    if (!groupExists) {
                        console.log('🔍 Layer group not in map, adding it');
                        window.map.addLayer(layer);
                    }
                }

                return layer;
            }
        }

        // Create new Tag Queries group if none exists
        console.log('🔍 Creating new Tag Queries group');
        const overlaysGroup = new ol.layer.Group({
            title: 'Tag Queries',
            type: 'tag-query',
            layers: []
        });

        // Set additional properties to match the expected overlay structure
        overlaysGroup.set('originalTitle', 'Tag Queries');
        overlaysGroup.set('id', 'tag-queries-group');

        config.layers.push(overlaysGroup);

        // If the map already exists, add the new layer group to it
        if (window.map) {
            console.log('🔍 Adding new layer group to existing map');
            window.map.addLayer(overlaysGroup);
        }

        console.log('🔍 Added Tag Queries group to config.layers');
        return overlaysGroup;
    }
}

/**
 * Format a number with K/M/B suffixes for large numbers
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Initialize when DOM is ready
$(document).ready(function() {
    // console.log('🔑 DOM ready, initializing key search');
    initKeySearch();
});

// Export for use in other modules
window.initKeySearch = initKeySearch;
