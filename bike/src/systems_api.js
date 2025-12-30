/**
 * Systems API for loading and searching bike sharing systems from systems.csv
 */

// Global systems data storage
window.systemsData = {
    systems: new Map(), // Map<SystemID, systemData>
    loaded: false
};

/**
 * Load systems data from CSV file
 */
function loadSystemsData() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.systemsData.loaded) {
            console.log('🚲 Systems data already loaded');
            resolve();
            return;
        }

        console.log('🚲 Loading systems data from CSV...');

        fetch('systems.csv')
            .then(response => {
                console.log('🚲 CSV fetch response status:', response.status);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('❌ Failed to load systems CSV:', text);
                        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${text}`);
                    });
                }
                return response.text();
            })
            .then(csvText => {
                console.log('🚲 CSV loaded, length:', csvText.length);
                console.log('🚲 First 500 chars of CSV:', csvText.substring(0, 500));
                if (!csvText || csvText.trim().length === 0) {
                    throw new Error('Systems CSV file is empty');
                }

                parseSystemsCSV(csvText);
                window.systemsData.loaded = true;
                console.log('🚲 Systems data loaded successfully');
                console.log(`🚲 Loaded ${window.systemsData.systems.size} systems`);

                // Debug: Log first few systems
                let count = 0;
                for (const [systemId, systemData] of window.systemsData.systems) {
                    if (count < 3) {
                        console.log('🚲 Sample system:', { systemId, systemData });
                        count++;
                    }
                }

                resolve();
            })
            .catch(error => {
                console.error('❌ Error loading systems data:', error);
                reject(error);
            });
    });
}

/**
 * Parse systems CSV data
 */
function parseSystemsCSV(csvText) {
    try {
        console.log('🚲 Starting to parse systems CSV data');
        const lines = csvText.split('\n');

        if (lines.length === 0) {
            console.error('❌ Empty systems CSV data');
            return;
        }

        console.log(`🚲 Parsing ${lines.length} lines of systems CSV data`);

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
                const values = parseCSVLine(line);
                if (values.length < 4) {
                    console.warn(`⚠️ Line ${i + 1}: Expected at least 4 columns, got ${values.length}`, values);
                    continue;
                }

                const systemData = {
                    countryCode: values[0]?.trim() || '',
                    name: values[1]?.trim() || '',
                    location: values[2]?.trim() || '',
                    systemId: values[3]?.trim() || '',
                    url: values[4]?.trim() || '',
                    autoDiscoveryUrl: values[5]?.trim() || '',
                    supportedVersions: values[6]?.trim() || '',
                    authInfoUrl: values[7]?.trim() || '',
                    authType: values[8]?.trim() || '',
                    authParamName: values[9]?.trim() || ''
                };

                if (systemData.systemId) {
                    window.systemsData.systems.set(systemData.systemId, systemData);
                }
            } catch (lineError) {
                console.error(`❌ Error processing line ${i + 1}:`, lineError);
                continue;
            }
        }

        console.log(`✅ Successfully parsed ${window.systemsData.systems.size} systems from CSV`);

    } catch (error) {
        console.error('❌ Fatal error in parseSystemsCSV:', error);
        throw error;
    }
}

/**
 * Search for systems matching a query string
 */
function searchSystems(query, limit = 100) {
    console.log('🔍 searchSystems called with query:', query, 'limit:', limit);
    console.log('🔍 systemsData exists:', !!window.systemsData);
    console.log('🔍 systemsData.loaded:', window.systemsData ? window.systemsData.loaded : 'N/A');
    console.log('🔍 systems size:', window.systemsData ? window.systemsData.systems.size : 'N/A');

    if (!query || query.length < 1) return [];

    const results = [];
    const queryLower = query.toLowerCase();

    console.log('🔍 Starting search iteration through systems...');

    for (const [systemId, systemData] of window.systemsData.systems) {
        console.log('🔍 Checking system:', systemId, 'systemData:', systemData);

        // Search in ALL text fields from the CSV
        const searchTexts = [
            systemData.countryCode ? systemData.countryCode.toLowerCase() : '',
            systemData.name ? systemData.name.toLowerCase() : '',
            systemData.location ? systemData.location.toLowerCase() : '',
            systemData.systemId ? systemData.systemId.toLowerCase() : '',
            systemData.url ? systemData.url.toLowerCase() : '',
            systemData.autoDiscoveryUrl ? systemData.autoDiscoveryUrl.toLowerCase() : '',
            systemData.supportedVersions ? systemData.supportedVersions.toLowerCase() : '',
            systemData.authInfoUrl ? systemData.authInfoUrl.toLowerCase() : '',
            systemData.authType ? systemData.authType.toLowerCase() : '',
            systemData.authParamName ? systemData.authParamName.toLowerCase() : ''
        ];

        let matchFound = false;
        let matchScore = 0;

        for (const searchText of searchTexts) {
            if (searchText && searchText.includes(queryLower)) {
                console.log('🔍 Found match in system', systemId, 'field:', searchText);
                matchFound = true;
                // Prioritize different fields differently
                if (searchText === (systemData.systemId ? systemData.systemId.toLowerCase() : '')) {
                    matchScore += 1000; // Exact system ID match gets highest priority
                } else if (searchText === (systemData.name ? systemData.name.toLowerCase() : '')) {
                    matchScore += 800; // Name match gets high priority
                } else if (searchText === (systemData.location ? systemData.location.toLowerCase() : '')) {
                    matchScore += 600; // Location match gets medium-high priority
                } else if (searchText.startsWith(queryLower)) {
                    matchScore += 100; // Starting with query
                } else {
                    matchScore += 10; // Contains query
                }
            }
        }

        if (matchFound) {
            console.log('🔍 Adding system to results:', systemId, 'score:', matchScore);
            const result = {
                systemId: systemData.systemId,
                name: systemData.name,
                location: systemData.location,
                countryCode: systemData.countryCode,
                url: systemData.url,
                matchScore: matchScore,
                type: 'system'
            };
            console.log('🔍 Result object:', result);
            results.push(result);

            if (results.length >= limit) {
                break;
            }
        }
    }

    console.log('🔍 Search completed, found', results.length, 'results');
    console.log('🔍 Results:', results);

    // Sort by match score (highest first)
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results.slice(0, limit);
}

/**
 * Get system data by system ID
 */
function getSystemById(systemId) {
    return window.systemsData.systems.get(systemId) || null;
}

/**
 * Initialize systems API
 */
function initSystemsAPI() {
    return loadSystemsData();
}

// Export functions
window.loadSystemsData = loadSystemsData;
window.searchSystems = searchSystems;
window.getSystemById = getSystemById;
window.initSystemsAPI = initSystemsAPI;
