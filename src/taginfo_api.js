/**
 * Taginfo API for loading and searching OSM tag definitions from CSV
 */

// Global taginfo data storage
window.taginfoData = {
    keys: new Map(),
    values: new Map(),
    definitions: new Map(),
    loaded: false
};

/**
 * Load taginfo definitions from CSV file
 */
function loadTaginfoDefinitions() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.taginfoData.loaded) {
            console.log('📊 Taginfo data already loaded');
            resolve();
            return;
        }

        console.log('📊 Loading taginfo definitions from CSV...');
        fetch('taginfo_definitions.csv')
            .then(response => {
                console.log('📊 CSV fetch response:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(csvText => {
                console.log('📊 CSV loaded, length:', csvText.length);
                parseCSVData(csvText);
                window.taginfoData.loaded = true;
                console.log('📊 Taginfo data loaded successfully');
                resolve();
            })
            .catch(error => {
                console.error('❌ Error loading taginfo definitions:', error);
                reject(error);
            });
    });
}

/**
 * Parse CSV data and organize it for fast searching
 */
function parseCSVData(csvText) {
    console.log('📊 Parsing CSV data...');
    const lines = csvText.split('\n');

    if (lines.length === 0) {
        console.error('❌ CSV file is empty!');
        return;
    }

    console.log('📊 CSV has', lines.length, 'lines');

    // Parse header
    const headers = lines[0].split(',');
    console.log('📊 CSV headers:', headers);

    // Process data rows (limit for performance)
    for (let i = 1; i < lines.length && i < 50000; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        if (values.length >= 20) {  // Updated to match actual CSV structure (20 columns)
            const [
                key, value, tag, definition_en, definition_ca, definition_es,
                count_all, count_all_fraction, count_nodes, count_nodes_fraction,
                count_ways, count_ways_fraction, count_relations, count_relations_fraction,
                in_wiki, projects, key_ca, value_ca, key_es, value_es
            ] = values;

            // Add to keys map
            if (!window.taginfoData.keys.has(key)) {
                window.taginfoData.keys.set(key, {
                    definition: definition_en || definition_ca || definition_es || '',  // Try multiple description fields
                    definition_en: definition_en || '',
                    definition_ca: definition_ca || '',
                    definition_es: definition_es || '',
                    key_ca: key_ca || '',
                    key_es: key_es || '',
                    totalCount: 0,
                    values: new Map() // Map<value, Array<entries>>
                });
            }

            const keyData = window.taginfoData.keys.get(key);

            // Allow multiple entries for the same key=value pair
            if (!keyData.values.has(value)) {
                keyData.values.set(value, []);
            }

            // Add this entry to the array for this value
            keyData.values.get(value).push({
                tag: tag,
                definition: definition_en || definition_ca || definition_es || '',  // Try multiple description fields
                definition_en: definition_en || '',
                definition_ca: definition_ca || '',
                definition_es: definition_es || '',
                value_ca: value_ca || '',
                value_es: value_es || '',
                countAll: parseInt(count_all) || 0,
                countNodes: parseInt(count_nodes) || 0,
                countWays: parseInt(count_ways) || 0,
                countRelations: parseInt(count_relations) || 0
            });

            keyData.totalCount += parseInt(count_all) || 0;

            // Add to values map (for global value search)
            if (!window.taginfoData.values.has(value)) {
                window.taginfoData.values.set(value, {
                    totalCount: 0
                });
            }
            window.taginfoData.values.get(value).totalCount += parseInt(count_all) || 0;

            // Add to definitions
            if (tag) {
                window.taginfoData.definitions.set(tag, definition_en || definition_ca || definition_es || '');
            }

            // Debug first few entries
            if (i <= 3) {
                console.log('📊 Sample entry:', {
                    key,
                    value,
                    count_all: parseInt(count_all) || 0,
                    count_ways: parseInt(count_ways) || 0,
                    definition_en: definition_en ? 'present' : 'empty',
                    definition_ca: definition_ca ? 'present' : 'empty',
                    definition_es: definition_es ? 'present' : 'empty'
                });
            }
        }
    }

    console.log('📊 Parsed keys:', window.taginfoData.keys.size);
    console.log('📊 Parsed values:', window.taginfoData.values.size);
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Add final field
    values.push(current);

    return values;
}

/**
 * Remove diacritics from a string for better Unicode search compatibility
 */
function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Search for keys matching a query string
 */
function searchKeys(query, limit = 20) {
    console.log('🔍 searchKeys called with:', query, 'limit:', limit);
    console.log('🔍 Available keys count:', window.taginfoData.keys.size);

    if (!query || query.length < 1) {
        console.log('🔍 Empty query, returning empty results');
        return [];
    }

    const results = [];
    const queryLower = query.toLowerCase();
    const queryNormalized = removeDiacritics(queryLower);

    console.log('🔍 Searching through keys...');
    let matchCount = 0;
    for (const [key, keyData] of window.taginfoData.keys) {
        // Search in key and all definition columns
        const searchTexts = [];

        // Prioritize key name much higher than descriptions
        searchTexts.push(removeDiacritics(`${key}`.toLowerCase()));  // Key name gets highest weight

        // Add definition columns with lower weight
        searchTexts.push(removeDiacritics(`${keyData.definition_en || ''}`.toLowerCase()));
        searchTexts.push(removeDiacritics(`${keyData.definition_ca || ''}`.toLowerCase()));
        searchTexts.push(removeDiacritics(`${keyData.definition_es || ''}`.toLowerCase()));
        searchTexts.push(removeDiacritics(`${keyData.key_ca || ''}`.toLowerCase()));
        searchTexts.push(removeDiacritics(`${keyData.key_es || ''}`.toLowerCase()));

        let matchFound = false;
        let matchScore = 0;

        for (const searchText of searchTexts) {
            if (searchText.includes(queryNormalized)) {
                matchFound = true;
                // Give much higher scores to key names vs descriptions
                if (searchText === removeDiacritics(`${key}`.toLowerCase())) matchScore += 1000;  // Exact key match
                else if (searchText.startsWith(queryNormalized)) matchScore += 100;  // Starts with query
                else matchScore += 1;  // Description match (lowest priority)
            }
        }

        if (matchFound) {
            matchCount++;
            console.log('🔍 Match found:', key, 'count:', keyData.totalCount, 'definition:', keyData.definition);

            results.push({
                key: key,
                definition: keyData.definition || '',
                definition_en: keyData.definition_en || '',
                definition_ca: keyData.definition_ca || '',
                definition_es: keyData.definition_es || '',
                totalCount: keyData.totalCount,
                type: 'key',
                matchScore: matchScore
            });

            if (results.length >= limit) {
                console.log('🔍 Reached limit, stopping search');
                break;
            }
        }
    }

    // Sort by relevance score first, then by count (most popular first)
    results.sort((a, b) => {
        const aScore = (a.matchScore || 0) * 100;  // Give higher weight to relevance
        const bScore = (b.matchScore || 0) * 100;

        // First sort by relevance score (higher is better)
        if (aScore !== bScore) {
            return bScore - aScore;
        }

        // Then sort by count (most popular first)
        const aCount = a.totalCount || 0;
        const bCount = b.totalCount || 0;
        return bCount - aCount;
    });

    console.log('🔍 Found', results.length, 'key results from', matchCount, 'matches');
    return results;
}

/**
 * Search for values matching a query string in any column for a specific key or globally
 * @param {string} query - The search query
 * @param {string|null} key - The key to search in, or null for global search
 * @param {number} limit - Maximum number of results
 */
function searchValues(query, key = null, limit = 100) {
    if (!query || query.length < 1) return [];

    const results = [];
    const queryLower = query.toLowerCase();
    const queryNormalized = removeDiacritics(queryLower);

    if (key && window.taginfoData.keys.has(key)) {
        // Search values for specific key
        const keyData = window.taginfoData.keys.get(key);

        // Iterate over all values for this key
        for (const [value, valueEntries] of keyData.values) {
            // Skip generic values (containing *) unless explicitly searching for *
            if (value.includes('*') && !queryNormalized.includes('*')) {
                continue;
            }

            // valueEntries is now an array of duplicate entries
            // For each entry, create a result (allowing duplicates if they exist)
            for (const valueData of valueEntries) {
                // Search in value, key, and all definition columns
                const searchTexts = [];

                // Prioritize value name much higher than descriptions
                searchTexts.push(removeDiacritics(`${value}`.toLowerCase()));  // Value name gets highest weight
                searchTexts.push(removeDiacritics(`${key}`.toLowerCase()));     // Key name gets high weight

                // Add definition columns with lower weight
                searchTexts.push(removeDiacritics(`${valueData.definition_en || ''}`.toLowerCase()));
                searchTexts.push(removeDiacritics(`${valueData.definition_ca || ''}`.toLowerCase()));
                searchTexts.push(removeDiacritics(`${valueData.definition_es || ''}`.toLowerCase()));
                searchTexts.push(removeDiacritics(`${valueData.value_ca || ''}`.toLowerCase()));
                searchTexts.push(removeDiacritics(`${valueData.value_es || ''}`.toLowerCase()));

                let matchFound = false;
                let matchScore = 0;

                for (const searchText of searchTexts) {
                    // For 'yes' and 'no' values, only show when explicitly searching for them
                    if ((value === 'yes' || value === 'no') && queryNormalized !== 'yes' && queryNormalized !== 'no') {
                        continue;
                    }

                    if (searchText.includes(queryNormalized)) {
                        matchFound = true;
                        // Give much higher scores to value/key names vs descriptions
                        if (searchText === removeDiacritics(`${value}`.toLowerCase())) matchScore += 1000;  // Exact value match
                        else if (searchText === removeDiacritics(`${key}`.toLowerCase())) matchScore += 500;   // Key name match
                        else if (searchText.startsWith(queryNormalized)) {
                            // For 'yes' and 'no', require exact match
                            if (value === 'yes' || value === 'no') {
                                if (queryNormalized === 'yes' || queryNormalized === 'no') {
                                    matchScore += 100;  // Higher priority only for exact matches
                                } else {
                                    matchScore += 1;   // Very low priority for partial matches
                                }
                            } else {
                                matchScore += 100; // Higher priority for other values that start with query
                            }
                        }
                        else {
                            // For description matches, be more flexible - allow partial matches in descriptions
                            const regex = new RegExp(`${queryNormalized}`, 'i');
                            if (regex.test(searchText)) {
                                matchScore += 15;   // Higher priority for description matches
                            }
                        }
                    }
                }

                if (matchFound && matchScore >= 5) {  // Lower threshold but still filter very weak matches
                    results.push({
                        key: key,
                        value: value,
                        tag: valueData.tag,
                        definition: valueData.definition || '',
                        definition_en: valueData.definition_en || '',
                        definition_ca: valueData.definition_ca || '',
                        definition_es: valueData.definition_es || '',
                        countAll: valueData.countAll,
                        countNodes: valueData.countNodes,
                        countWays: valueData.countWays,
                        countRelations: valueData.countRelations,
                        type: 'value',
                        matchScore: matchScore
                    });

                    if (results.length >= limit) break;
                }
            }
            if (results.length >= limit) break;
        }
    } else {
        // Global search across all values and keys
        const valueResults = new Map(); // Use Map to avoid duplicates

        // Search in all values
        for (const [value, valueData] of window.taginfoData.values) {
            // Skip generic values (containing *) unless explicitly searching for *
            if (value.includes('*') && !queryNormalized.includes('*')) {
                continue;
            }

            // Find keys that use this value
            const keysWithValue = [];
            for (const [keyItem, keyData] of window.taginfoData.keys) {
                if (keyData.values.has(value)) {
                    keysWithValue.push(keyItem);
                }
            }

            if (keysWithValue.length === 0) continue;

            // Search in value, keys, and all definition columns for each key that uses this value
            let matchFound = false;
            let matchScore = 0;
            const searchTexts = [];

            // Prioritize value and key names much higher than descriptions
            searchTexts.push(removeDiacritics(`${value}`.toLowerCase()));  // Value name gets highest weight
            searchTexts.push(removeDiacritics(`${keysWithValue.join(' ')}`.toLowerCase()));  // Key names get high weight

            // Debug: Log what we're searching for
            console.log('🔍 Searching for value:', value, 'keys:', keysWithValue);
            console.log('🔍 Query normalized:', queryNormalized);
            console.log('🔍 Search texts:', searchTexts);

            // Add definition columns with lower weight - search in ALL entries for each key
            for (const valueKey of keysWithValue) {
                const keyData = window.taginfoData.keys.get(valueKey);
                if (keyData && keyData.values.has(value)) {
                    // valueEntries is now an array of entries
                    const valueEntries = keyData.values.get(value);
                    for (const valueEntry of valueEntries) {
                        // Definition columns get much lower weight
                        searchTexts.push(removeDiacritics(`${valueEntry.definition_en || ''}`.toLowerCase()));
                        searchTexts.push(removeDiacritics(`${valueEntry.definition_ca || ''}`.toLowerCase()));
                        searchTexts.push(removeDiacritics(`${valueEntry.definition_es || ''}`.toLowerCase()));
                        searchTexts.push(removeDiacritics(`${valueEntry.value_ca || ''}`.toLowerCase()));
                        searchTexts.push(removeDiacritics(`${valueEntry.value_es || ''}`.toLowerCase()));
                        // Key translation columns also get lower weight
                        searchTexts.push(removeDiacritics(`${keyData.key_ca || ''}`.toLowerCase()));
                        searchTexts.push(removeDiacritics(`${keyData.key_es || ''}`.toLowerCase()));
                    }
                }
            }

            for (const searchText of searchTexts) {
                // For 'yes' and 'no' values, only show when explicitly searching for them
                if ((value === 'yes' || value === 'no') && queryNormalized !== 'yes' && queryNormalized !== 'no') {
                    continue;
                }

                if (searchText.includes(queryNormalized)) {
                    matchFound = true;
                    console.log('🔍 Match found! searchText:', searchText, 'query:', queryNormalized);
                    // Give much higher scores to exact matches vs partial matches
                    if (searchText === removeDiacritics(`${value}`.toLowerCase())) {
                        matchScore += 1000;  // Exact value match gets highest priority
                        console.log('🔍 Exact value match for:', value);
                    } else if (searchText === removeDiacritics(`${keysWithValue.join(' ')}`.toLowerCase())) {
                        matchScore += 500;   // Exact key name match
                    } else if (searchText.startsWith(queryNormalized)) {
                        // Prioritize starts-with matches, but not for very common values
                        if (value === 'yes' || value === 'no') {
                            // For 'yes' and 'no', only show when user types the exact word
                            if (queryNormalized === 'yes' || queryNormalized === 'no') {
                                matchScore += 100;  // High priority only for exact matches
                            } else {
                                matchScore += 1;   // Very low priority for partial matches
                            }
                        } else {
                            matchScore += 100; // Higher priority for other values that start with query
                        }
                    } else if (queryNormalized.length >= 3 && searchText.includes(queryNormalized)) {
                        // For queries of 3+ characters, also match partial strings (not just word boundaries)
                        // This helps find "churrería" when searching for "chur"
                        if (value !== 'yes' && value !== 'no') {
                            matchScore += 50; // Medium priority for partial matches from 3rd letter
                        }
                    } else {
                        // For description matches, be more flexible - allow partial matches in descriptions
                        // This helps find values like "churro" when searching for "churrería" (which appears in descriptions)
                        const regex = new RegExp(`${queryNormalized}`, 'i');
                        if (regex.test(searchText)) {
                            // Description matches - include for relevant values
                            if (value !== 'yes' && value !== 'no') {
                                matchScore += 15;   // Higher priority for description matches
                            }
                        }
                    }
                }
            }

            if (matchFound && matchScore >= 5) {  // Lower threshold but still filter very weak matches
                // For each key that uses this value, create a result for each duplicate entry
                for (const valueKey of keysWithValue) {
                    const keyData = window.taginfoData.keys.get(valueKey);
                    const valueEntries = keyData ? keyData.values.get(value) : null;

                    if (valueEntries && valueEntries.length > 0) {
                        for (let i = 0; i < valueEntries.length; i++) {
                            const entry = valueEntries[i];
                            const resultKey = `${valueKey}=${value}_${i}`; // Add index to make unique

                            if (!valueResults.has(resultKey)) {
                                valueResults.set(resultKey, {
                                    value: value,
                                    key: valueKey,
                                    totalCount: valueData.totalCount,
                                    keys: keysWithValue,
                                    type: 'value',
                                    tag: null,
                                    definition: entry.definition || '',
                                    definition_en: entry.definition_en || '',
                                    definition_ca: entry.definition_ca || '',
                                    definition_es: entry.definition_es || '',
                                    countAll: entry.countAll,
                                    countNodes: entry.countNodes,
                                    countWays: entry.countWays,
                                    countRelations: entry.countRelations,
                                    matchScore: matchScore  // Add relevance score
                                });

                                if (valueResults.size >= limit) break;
                            }
                        }
                        if (valueResults.size >= limit) break;
                    }
                }
                if (valueResults.size >= limit) break;
            }
        }

        // Convert Map to array
        results.push(...Array.from(valueResults.values()));

        // If we don't have enough results, also search in key definitions
        if (results.length < limit) {
            for (const [keyItem, keyData] of window.taginfoData.keys) {
                if (results.length >= limit) break;

                // Search in key and all definition columns
                const searchTexts = [
                    removeDiacritics(`${keyItem}`.toLowerCase()),
                    removeDiacritics(`${keyData.definition_en || ''}`.toLowerCase()),
                    removeDiacritics(`${keyData.definition_ca || ''}`.toLowerCase()),
                    removeDiacritics(`${keyData.definition_es || ''}`.toLowerCase()),
                    removeDiacritics(`${keyData.key_ca || ''}`.toLowerCase()),
                    removeDiacritics(`${keyData.key_es || ''}`.toLowerCase())
                ];

                let matchFound = false;
                let matchScore = 0;

                for (const searchText of searchTexts) {
                    if (searchText.includes(queryNormalized)) {
                        matchFound = true;
                        // Give higher score to exact matches
                        if (searchText === queryNormalized) matchScore += 100;
                        else if (searchText.startsWith(queryNormalized)) matchScore += 50;
                        else matchScore += 10;
                    }
                }

                if (matchFound && matchScore >= 20) {  // Higher threshold for key search
                    // Get the most popular value for this key
                    let popularValue = null;
                    let maxCount = 0;

                    for (const [value, valueEntries] of keyData.values) {
                        // Sum up all counts for this value across duplicate entries
                        let totalCountForValue = 0;
                        for (const entry of valueEntries) {
                            totalCountForValue += entry.countAll || 0;
                        }
                        if (totalCountForValue > maxCount) {
                            maxCount = totalCountForValue;
                            popularValue = value;
                        }
                    }

                    if (popularValue) {
                        const resultKey = `${keyItem}=${popularValue}`;
                        if (!results.some(r => `${r.key}=${r.value}` === resultKey)) {
                            results.push({
                                key: keyItem,
                                value: popularValue,
                                tag: null,
                                definition: keyData.definition || '',
                                definition_en: keyData.definition_en || '',
                                definition_ca: keyData.definition_ca || '',
                                definition_es: keyData.definition_es || '',
                                countAll: maxCount,
                                type: 'key',
                                matchScore: matchScore
                            });
                        }
                    }
                }
            }
        }
    }

    // Sort by relevance score first, then by count (most popular first)
    results.sort((a, b) => {
        const aScore = (a.matchScore || 0) * 5;  // Reduced relevance weight
        const bScore = (b.matchScore || 0) * 5;

        // Calculate popularity bonus (logarithmic scale to prevent extreme differences)
        const aPopularity = Math.log10((a.countAll || a.totalCount || 0) + 1);
        const bPopularity = Math.log10((b.countAll || b.totalCount || 0) + 1);

        const aFinal = aScore + aPopularity;
        const bFinal = bScore + bPopularity;

        // Sort by final score (higher is better)
        return bFinal - aFinal;
    });

    return results.slice(0, limit);
}

/**
 * Get tag definition by tag string (key=value format)
 */
function getTagDefinition(tag) {
    return window.taginfoData.definitions.get(tag) || null;
}

/**
 * Generate Overpass query for a key-value combination with bbox and element type filtering
 * @param {string} key - The OSM key to search for
 * @param {string|null} value - The OSM value to search for (optional for generic key search)
 * @param {Array<number>} bbox - The bounding box [minLon, minLat, maxLon, maxLat]
 * @param {Array<string>} elementTypes - Array of element types to search ['node', 'way', 'relation']
 */
function generateOverpassQuery(key, value = null, bbox, elementTypes = ['node', 'way', 'relation']) {
    console.log('🔧 generateOverpassQuery called with:');
    console.log('🔧 key:', JSON.stringify(key), 'value:', JSON.stringify(value));
    console.log('🔧 key length:', key ? key.length : 'null', 'value length:', value ? value.length : 'null');
    console.log('🔧 bbox:', bbox);
    console.log('🔧 elementTypes:', elementTypes);
    console.log('🔧 elementTypes.includes("node"):', elementTypes.includes('node'));
    console.log('🔧 elementTypes.includes("way"):', elementTypes.includes('way'));
    console.log('🔧 elementTypes.includes("relation"):', elementTypes.includes('relation'));

    // Validate inputs
    if (!key) {
        console.error('🔧 Invalid key:', key);
        return null;
    }

    // Trim whitespace from key and value
    key = key.trim();
    if (value) value = value.trim();

    console.log('🔧 After trimming - key:', JSON.stringify(key), 'value:', JSON.stringify(value));

    if (!key) {
        console.error('🔧 Key is empty after trimming:', key);
        return null;
    }

    if (!bbox || bbox.length !== 4 || bbox.some(isNaN)) {
        console.error('🔧 Invalid bbox:', bbox);
        return null;
    }

    // Ensure bbox coordinates are within valid ranges
    if (bbox.some(coord => Math.abs(coord) > 180)) {
        console.error('🔧 Bbox coordinates out of range:', bbox);
        return null;
    }

    // Build the query - handle both specific value queries and generic key queries
    const bboxStr = `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`;

    if (value) {
        // Specific key=value query - include all selected element types
        let queryParts = [];

        // Add nodes first (standalone nodes with tags)
        if (elementTypes.includes('node')) {
            queryParts.push(`  node["${key}"="${value}"](${bboxStr})`);
        }

        // Add ways and their nodes
        if (elementTypes.includes('way')) {
            queryParts.push(`  way["${key}"="${value}"](${bboxStr})`);
            queryParts.push(`  node(w)`); // Get nodes of the ways - these will be marked as polygon nodes
        }

        // Add relations and their member nodes
        if (elementTypes.includes('relation')) {
            queryParts.push(`  relation["${key}"="${value}"](${bboxStr})`);
            queryParts.push(`  way(r)`); // Get ways that are members of these relations
            queryParts.push(`  node(w)`); // Get nodes of those ways - these will be marked as polygon nodes
        }

        const query = `[out:xml][timeout:35];\n(\n${queryParts.join(';\n')};\n);\nout meta;`;
        console.log('🔧 Generated multi-element query:', query);
        return query;
    } else {
        // Generic key query (all values for this key) - include all selected element types
        let queryParts = [];

        // Add nodes first (standalone nodes with tags)
        if (elementTypes.includes('node')) {
            queryParts.push(`  node["${key}"](${bboxStr})`);
        }

        // Add ways and their nodes
        if (elementTypes.includes('way')) {
            queryParts.push(`  way["${key}"](${bboxStr})`);
            queryParts.push(`  node(w)`); // Get nodes of the ways - these will be marked as polygon nodes
        }

        // Add relations and their member nodes
        if (elementTypes.includes('relation')) {
            queryParts.push(`  relation["${key}"](${bboxStr})`);
            queryParts.push(`  way(r)`); // Get ways that are members of these relations
            queryParts.push(`  node(w)`); // Get nodes of those ways - these will be marked as polygon nodes
        }

        const query = `[out:xml][timeout:60];\n(\n${queryParts.join(';\n')};\n);\nout meta;`;
        console.log('🔧 Generated multi-element generic query:', query);
        return query;
    }
}

/**
 * Initialize taginfo API
 */
function initTaginfoAPI() {
    return loadTaginfoDefinitions();
}

// Export updated function for use in other modules
window.loadTaginfoDefinitions = loadTaginfoDefinitions;
window.searchKeys = searchKeys;
window.searchValues = searchValues;
window.getTagDefinition = getTagDefinition;
window.generateOverpassQuery = generateOverpassQuery;
window.initTaginfoAPI = initTaginfoAPI;
window.removeDiacritics = removeDiacritics;
window.parseCSVLine = parseCSVLine;
