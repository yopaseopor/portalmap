// Vector tile styles for OpenLayers 7.3.0
const vectorTileStyles = {
    'versatiles-shortbread': function(feature, resolution) {
        const type = feature.getGeometry().getType();
        const props = feature.getProperties();
        
        // Default style for all features
        let style = new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.7)'
            }),
            stroke: new ol.style.Stroke({
                color: '#666',
                width: 1
            })
        });

        // Style based on feature type
        if (type === 'Point' || type === 'MultiPoint') {
            // Point features (nodes, POIs)
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 4,
                    fill: new ol.style.Fill({
                        color: '#ff6b6b'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 1
                    })
                })
            });
        } else if (type === 'LineString' || type === 'MultiLineString') {
            // Line features (roads, paths)
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#4a90e2',
                    width: 2
                })
            });
        } else if (type === 'Polygon' || type === 'MultiPolygon') {
            // Polygon features (buildings, landuse)
            style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(200, 200, 200, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#666',
                    width: 1
                })
            });
        }

        return style;
    },

    'openmaptiles': function(feature, resolution) {
        // Simplified style for OpenMapTiles
        const type = feature.getGeometry().getType();
        
        if (type === 'Point' || type === 'MultiPoint') {
            return new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: '#ff6b6b'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 1
                    })
                })
            });
        }
        
        // Default style for other types
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(200, 200, 200, 0.5)'
            }),
            stroke: new ol.style.Stroke({
                color: '#666',
                width: 1
            })
        });
    }
};

// Export the styles
if (typeof module !== 'undefined' && module.exports) {
    module.exports = vectorTileStyles;
} else {
    window.vectorTileStyles = vectorTileStyles;
}
