/**
 * Taginfo API for loading and searching OSM tag definitions from CSV
 */

// Global taginfo data storage
window.taginfoData = {
    keys: new Map(),
    values: new Map(),
    definitions: new Map(),
    loaded: false,
    language: 'ca' // Default language
};

// Alternate dataset focused on yes/no definitions
window.taginfoDataYes = {
    keys: new Map(),
    values: new Map(),
    definitions: new Map(),
    loaded: false,
    language: 'ca' // Default language
};

// Get the current language from the i18n module if available
function getCurrentLanguage() {
    try {
        // Try to get language from URL first
        const urlParams = new URLSearchParams(window.location.search);
        const lang = urlParams.get('lang') || 'ca';
        
        // Validate language
        if (['ca', 'es', 'en', 'da'].includes(lang)) {
            return lang;
        }
        
        // Fallback to i18n if available
        if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
            return window.i18n.getCurrentLanguage();
        }
    } catch (e) {
        // console.error('Error getting current language:', e);
    }
    // Default to Catalan
    return 'ca';
}

// Get the appropriate CSV file name based on language
function getTaginfoCsvPath(isYesNo = false) {
    const lang = getCurrentLanguage();
    const suffix = isYesNo ? '_yes' : '';
    return `taginfo_simple_${lang}${suffix}.csv`;
}

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
        const csvPath = getTaginfoCsvPath(false);
        console.log('📊 Loading CSV from:', csvPath);
        
        fetch(csvPath)
            .then(response => {
                console.log('📊 CSV fetch response status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('❌ Failed to load CSV:', text);
                        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${text}`);
                    });
                }
                return response.text();
            })
            .then(csvText => {
                console.log('📊 CSV loaded, length:', csvText.length);
                if (!csvText || csvText.trim().length === 0) {
                    throw new Error('CSV file is empty');
                }
                
                // Log first 200 chars of CSV for debugging
                console.log('📊 CSV sample:', csvText.substring(0, 200) + '...');
                
                parseCSVDataSimple(csvText, window.taginfoData);
                window.taginfoData.loaded = true;
                console.log('📊 Taginfo data loaded successfully');
                console.log(`📊 Loaded ${window.taginfoData.keys.size} keys and ${window.taginfoData.definitions.size} definitions`);
                resolve();
            })
            .catch(error => {
                console.error('❌ Error loading taginfo definitions:', error);
                console.error('❌ Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                reject(error);
            });
    });
}

// Load the alternate yes/no-focused CSV into a separate data store
function loadTaginfoDefinitionsYes() {
    return new Promise((resolve, reject) => {
        if (window.taginfoDataYes.loaded) {
            // console.log('📊 Taginfo YES data already loaded');
            resolve();
            return;
        }

        // console.log('📊 Loading yes/no-focused taginfo definitions from CSV...');
        const csvPath = getTaginfoCsvPath(true);
        // console.log('📊 Loading YES/NO CSV from:', csvPath);
        fetch(csvPath)
            .then(response => {
                // console.log('📊 YES CSV fetch response:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(csvText => {
                // console.log('📊 YES CSV loaded, length:', csvText.length);
                parseCSVDataSimple(csvText, window.taginfoDataYes);
                window.taginfoDataYes.loaded = true;
                // console.log('📊 Taginfo YES data loaded successfully');
                resolve();
            })
            .catch(error => {
                console.error('❌ Error loading taginfo YES definitions:', error);
                reject(error);
            });
    });
}

/**
 * Parse simplified CSV data (key, value, definition) and organize it for fast searching
 */
function parseCSVDataSimple(csvText, targetData = window.taginfoData) {
    try {
        console.log('📊 Starting to parse CSV data');
        const lines = csvText.split('\n');

        if (lines.length === 0) {
            console.error('❌ Empty CSV data');
            return;
        }

        console.log(`📊 Parsing ${lines.length} lines of CSV data`);
        
        // Get current language for dynamic property names
        const lang = getCurrentLanguage();
        console.log(`📊 Current language: ${lang}`);

        // Process each line
        let lineCount = 0;
        for (let i = 1; i < lines.length && i < 50000; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
                const values = parseCSVLine(line);
                if (values.length < 3) {
                    console.warn(`⚠️ Line ${i + 1}: Expected at least 3 columns, got ${values.length}`, values);
                    continue;
                }

                const key = values[0]?.trim() || '';
                const value = values[1]?.trim() || '';
                let definition = values[2]?.trim() || '';

                // Handle common character encoding issues
                if (typeof definition === 'string') {
                    definition = definition
                        .replace(/Ã³/g, 'ó')
                        .replace(/Ã©/g, 'é')
                        .replace(/Ã¨/g, 'è')
                        .replace(/Ã /g, 'à')
                        .replace(/Ã¯/g, 'ï')
                        .replace(/Ã±/g, 'ñ')
                        .replace(/Ã§/g, 'ç')
                        .replace(/Ã/g, 'í')
                        .replace(/â/g, '–')  // en dash
                        .replace(/â/g, '—')  // em dash
                        .replace(/â/g, '\'')  // right single quote
                        .replace(/â/g, '"')  // left double quote
                        .replace(/â/g, '"');  // right double quote
                }

                // Initialize key data if it doesn't exist
                if (!targetData.keys.has(key)) {
                    targetData.keys.set(key, {
                        definition: definition,
                        totalCount: 0,
                        values: new Map()
                    });
                    
                    // Set language-specific definition
                    targetData.keys.get(key)[`definition_${lang}`] = definition;
                }

                const keyData = targetData.keys.get(key);

                // Initialize value array if it doesn't exist
                if (!keyData.values.has(value)) {
                    keyData.values.set(value, []);
                }

                // Create entry with language-specific definition
                const entry = {
                    definition: definition,
                    countAll: 0, // No count data in simplified CSV
                    [`definition_${lang}`]: definition
                };
                
                keyData.values.get(value).push(entry);
                keyData.totalCount += 1;
                lineCount++;
                
                // Track values globally
                if (!targetData.values.has(value)) {
                    targetData.values.set(value, { totalCount: 0 });
                }
                targetData.values.get(value).totalCount += 1;

                // Store the tag for reverse lookup
                const tag = `${key}=${value}`;
                if (tag) {
                    targetData.definitions.set(tag, definition || '');
                }
            } catch (lineError) {
                console.error(`❌ Error processing line ${i + 1}:`, lineError);
                console.error('Line content:', line);
                continue;
            }
        }
        
        console.log(`✅ Successfully parsed ${lineCount} entries from CSV`);
        return lineCount;
        
    } catch (error) {
        console.error('❌ Fatal error in parseCSVDataSimple:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
}

/**
 * Parse CSV data and organize it for fast searching
 */
function parseCSVData(csvText, targetData = window.taginfoData) {
    const lines = csvText.split('\n');

    if (lines.length === 0) {
        console.error('Empty CSV data');
        return;
    }

    const headers = lines[0].split(',');

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

            if (!targetData.keys.has(key)) {
                targetData.keys.set(key, {
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

            const keyData = targetData.keys.get(key);

            if (!keyData.values.has(value)) {
                keyData.values.set(value, []);
            }

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

            if (!targetData.values.has(value)) {
                targetData.values.set(value, {
                    totalCount: 0
                });
            }
            targetData.values.get(value).totalCount += parseInt(count_all) || 0;

            if (tag) {
                targetData.definitions.set(tag, definition_en || definition_ca || definition_es || '');
            }
        }
    }
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
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }

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
    if (!query || query.length < 1) {
        return [];
    }

    const results = [];
    const queryLower = query.toLowerCase();
    const queryNormalized = removeDiacritics(queryLower);

    let matchCount = 0;
    for (const [key, keyData] of window.taginfoData.keys) {
        // Only search in the key and main definition (already in current language)
        const searchTexts = [
            removeDiacritics(`${key}`.toLowerCase()),
            removeDiacritics(`${keyData.definition || ''}`.toLowerCase())
        ];

        let matchFound = false;
        let matchScore = 0;

        for (const searchText of searchTexts) {
            if (searchText.includes(queryNormalized)) {
                matchFound = true;
                if (searchText === removeDiacritics(`${key}`.toLowerCase())) matchScore += 1000;  
                else if (searchText.startsWith(queryNormalized)) matchScore += 100;  
                else matchScore += 1;  
            }
        }

        if (matchFound) {
            matchCount++;
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
                break;
            }
        }
    }

    results.sort((a, b) => {
        const aScore = (a.matchScore || 0) * 100;  
        const bScore = (b.matchScore || 0) * 100;

        if (aScore !== bScore) {
            return bScore - aScore;
        }

        const aCount = a.totalCount || 0;
        const bCount = b.totalCount || 0;
        return bCount - aCount;
    });

    return results;
}

/**
 * Search for values matching a query string in any column for a specific key or globally
 * @param {string} query - The search query
 * @param {string|null} key - The key to search in, or null for global search
 * @param {number} limit - Maximum number of results
 */
function searchValues(query, key = null, limit = 100, useYesCsv = false) {
    if (!query || query.length < 1) return [];

    const results = [];
    const queryLower = query.toLowerCase();
    const queryNormalized = removeDiacritics(queryLower);

    // Select dataset to use (default or yes/no-focused)
    const data = useYesCsv ? window.taginfoDataYes : window.taginfoData;
    
    // If in yes/no mode and no key is provided, find all keys that match the query
    if (useYesCsv && !key) {
        // Search through all keys in the yes/no dataset
        for (const [currentKey, keyData] of data.keys) {
            // Only process yes/no values
            for (const [value, valueEntries] of keyData.values) {
                if (value !== 'yes' && value !== 'no') continue;
                
                // Check if the key matches the query
                const keyMatch = currentKey.toLowerCase().includes(queryNormalized);
                let definitionMatch = false;
                
                // Check all entries for a matching definition in the current language
                for (const valueData of valueEntries) {
                    if (valueData.definition && 
                        removeDiacritics(valueData.definition.toLowerCase()).includes(queryNormalized)) {
                        definitionMatch = true;
                        break;
                    }
                }
                
                if (keyMatch || definitionMatch) {
                    // Add to results
                    results.push({
                        key: currentKey,
                        value: value,
                        definition: valueEntries[0]?.definition || '',
                        totalCount: keyData.totalCount || 0,
                        matchScore: keyMatch ? 1000 : 100  // Higher score for key matches
                    });
                }
            }
        }
        
        // Sort and limit results
        return results
            .sort((a, b) => b.matchScore - a.matchScore || b.totalCount - a.totalCount)
            .slice(0, limit);
    }
    
    if (key && data.keys.has(key)) {
        // Search values for specific key
        const keyData = data.keys.get(key);

        // Iterate over all values for this key
        for (const [value, valueEntries] of keyData.values) {
            // In yes/no mode, only process 'yes' and 'no' values
            if (useYesCsv) {
                if (value !== 'yes' && value !== 'no') {
                    continue;
                }
                
                // Only proceed if the search term is in the key or definition
                const keyMatch = key.toLowerCase().includes(queryNormalized);
                let definitionMatch = false;
                
                // Check all entries for a matching definition in the current language
                for (const valueData of valueEntries) {
                    if (valueData.definition) {
                        // Normalize the definition by removing spaces around equals sign for better matching
                        const normalizedDef = removeDiacritics(valueData.definition.toLowerCase())
                            .replace(/\s*=\s*/g, '=');
                        
                        if (normalizedDef.includes(queryNormalized)) {
                            definitionMatch = true;
                            break;
                        }
                    }
                }
                
                if (!keyMatch && !definitionMatch) {
                    continue;
                }
            } 
            // Skip generic values (containing *) unless explicitly searching for *
            else if (value.includes('*') && !queryNormalized.includes('*')) {
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

                // Normalize the definition by removing spaces around equals sign for better matching
                const normalizedDef = valueData.definition 
                    ? removeDiacritics(valueData.definition.toLowerCase())
                        .replace(/\s*=\s*/g, '=')
                    : '';
                    
                const searchFields = [
                    normalizedDef
                ].filter(Boolean); // Remove any undefined/null values
                
                // Add all available definitions to search text
                searchFields.forEach(definition => {
                    if (definition) {
                        searchTexts.push(removeDiacritics(definition.toLowerCase()));
                    }
                });

                let matchFound = false;
                let matchScore = 0;

                for (const searchText of searchTexts) {
                    // For 'yes' and 'no' values in non-yes/no mode, only show when explicitly searching for them
                    if (!useYesCsv && (value === 'yes' || value === 'no') && 
                        queryNormalized !== 'yes' && queryNormalized !== 'no') {
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
    for (const [value, valueData] of data.values) {
            // Skip generic values (containing *) unless explicitly searching for *
            if (value.includes('*') && !queryNormalized.includes('*')) {
                continue;
            }

            // Find keys that use this value
            const keysWithValue = [];
            for (const [keyItem, keyData] of data.keys) {
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

            // Debug: Log what we're searching for (commented out for production)
            // console.log('🔍 Searching for value:', value, 'keys:', keysWithValue);
            // console.log('🔍 Query normalized:', queryNormalized);
            // console.log('🔍 Search texts:', searchTexts);

            // Add main definition field for each key that uses this value
            for (const valueKey of keysWithValue) {
                const keyData = data.keys.get(valueKey);
                if (keyData && keyData.values.has(value)) {
                    const valueEntries = keyData.values.get(value);
                    for (const valueEntry of valueEntries) {
                        // Only use the main definition field (already in current language)
                        if (valueEntry.definition) {
                            // Normalize the definition by removing spaces around equals sign for better matching
                            const normalizedDef = removeDiacritics(valueEntry.definition.toLowerCase())
                                .replace(/\s*=\s*/g, '=');
                            searchTexts.push(normalizedDef);
                        }
                    }
                }
            }

            for (const searchText of searchTexts) {
                // For 'yes' and 'no' values in non-yes/no mode, only show when explicitly searching for them
                if (!useYesCsv && (value === 'yes' || value === 'no') && queryNormalized !== 'yes' && queryNormalized !== 'no') {
                    continue;
                }

                if (searchText.includes(queryNormalized)) {
                    matchFound = true;
                    // Give much higher scores to exact matches vs partial matches
                    if (searchText === removeDiacritics(`${value}`.toLowerCase())) {
                        matchScore += 1000;  // Exact value match gets highest priority
                        // console.log('🔍 Exact value match for:', value);
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
                    const keyData = data.keys.get(valueKey);
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
            for (const [keyItem, keyData] of data.keys) {
                if (results.length >= limit) break;

                // Search in key and main definition (already in current language)
                const searchTexts = [
                    removeDiacritics(`${keyItem}`.toLowerCase()),
                    removeDiacritics(`${keyData.definition || ''}`.toLowerCase())
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
    // console.log('🔧 generateOverpassQuery called with:');
    // console.log('🔧 key:', JSON.stringify(key), 'value:', JSON.stringify(value));
    // console.log('🔧 key length:', key ? key.length : 'null', 'value length:', value ? value.length : 'null');
    // console.log('🔧 bbox:', bbox);
    // console.log('🔧 elementTypes:', elementTypes);
    // console.log('🔧 elementTypes.includes("node"):', elementTypes.includes('node'));
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

function initTaginfoAPIYes() {
    return loadTaginfoDefinitionsYes();
}

// Export updated function for use in other modules
window.loadTaginfoDefinitions = loadTaginfoDefinitions;
window.searchKeys = searchKeys;
window.searchValues = searchValues;
window.getTagDefinition = getTagDefinition;
window.generateOverpassQuery = generateOverpassQuery;
window.initTaginfoAPI = initTaginfoAPI;
window.initTaginfoAPIYes = initTaginfoAPIYes;
window.removeDiacritics = removeDiacritics;
window.parseCSVLine = parseCSVLine;
