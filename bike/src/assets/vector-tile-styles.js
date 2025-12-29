// Vector tile styles for OpenLayers 7.3.0
// Ultra-minimal style function that completely avoids text rendering
(function() {
    // Check if OpenLayers is available
    if (typeof ol === 'undefined') {
        console.error('OpenLayers is not loaded');
        return;
    }

    // Initialize vectorTileStyles in global scope if it doesn't exist
    if (!window.vectorTileStyles) {
        window.vectorTileStyles = {};
    }
    
    // Create a minimal style function that returns an empty array for all features
    function createMinimalStyle() {
        return function() {
            return [];
        };
    }

    // Style definitions based on customyopaseopor.json
    const styleDefinitions = {
        // Background
        background: {
            fill: new ol.style.Fill({
                color: '#f9f4ee' // Light beige background from the style
            })
        },
        // Water
        water: {
            fill: new ol.style.Fill({
                color: 'rgba(170, 211, 223, 0.5)' // Light blue water
            })
        },
        // Major roads
        highway_motorway: {
            stroke: new ol.style.Stroke({
                color: '#f28cb1', // Pinkish color for motorways
                width: 2
            })
        },
        // Minor roads
        highway_residential: {
            stroke: new ol.style.Stroke({
                color: '#ffffff', // White for residential roads
                width: 1
            })
        },
        // Buildings
        building: {
            fill: new ol.style.Fill({
                color: 'rgba(210, 209, 207, 0.7)' // Light gray for buildings
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(180, 179, 177, 0.7)',
                width: 0.5
            })
        },
        // Parks and green areas
        landuse_park: {
            fill: new ol.style.Fill({
                color: 'rgba(200, 250, 200, 0.3)' // Light green for parks
            })
        }
    };

    // Main style function
    function customyopaseoporStyle(feature, resolution) {
        try {
            if (!feature || !feature.getGeometry) {
                return [];
            }

            const type = feature.getGeometry().getType();
            const layer = feature.get('layer') || '';
            const highway = feature.get('highway') || '';
            const building = feature.get('building');
            const landuse = feature.get('landuse');
            const water = feature.get('water');
            const natural = feature.get('natural');
            
            // Skip text and label features
            if (layer.includes('label') || 
                feature.get('class') === 'label' || 
                feature.get('type') === 'label') {
                return [];
            }

            const styles = [];
            
            // Apply styles based on feature properties
            if (water === 'lake' || natural === 'water') {
                styles.push(new ol.style.Style(styleDefinitions.water));
            } 
            else if (highway === 'motorway' || highway === 'trunk') {
                styles.push(new ol.style.Style(styleDefinitions.highway_motorway));
            }
            else if (highway === 'residential' || highway === 'service') {
                styles.push(new ol.style.Style(styleDefinitions.highway_residential));
            }
            else if (building) {
                styles.push(new ol.style.Style(styleDefinitions.building));
            }
            else if (landuse === 'park' || landuse === 'grass' || natural === 'grassland') {
                styles.push(new ol.style.Style(styleDefinitions.landuse_park));
            }
            
            return styles;
            
        } catch (e) {
            console.error('Error applying customyopaseopor style:', e);
            return [];
        }
    }

    // Define styles - using the minimal style for all cases except Customyopaseopor
    window.vectorTileStyles = {
        'Customyopaseopor': customyopaseoporStyle,
        'openmaptiles': createMinimalStyle(),
        'versatiles-shortbread': createMinimalStyle()
    };

    console.log('Vector tile styles initialized with minimal styles and customyopaseopor style');
})();
