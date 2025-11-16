/**
 * Maptiler Basic Vector Tile Style
 * Implementation of Maptiler Basic style for OpenLayers
 * Based on the official Maptiler Basic style specification
 */

(function() {
    'use strict';

    if (typeof ol === 'undefined') {
        console.error('OpenLayers is not loaded');
        return;
    }

    // Initialize vectorTileStyles in global scope if it doesn't exist
    if (typeof window !== 'undefined' && !window.vectorTileStyles) {
        window.vectorTileStyles = {};
    }

    // Helper function to calculate zoom level from resolution
    function getZoom(resolution) {
        return Math.log2(156543.03390625 / resolution);
    }

    // Helper function to interpolate between stops
    function interpolate(zoom, stops, base = 1) {
        if (!stops || stops.length === 0) return 0;
        if (zoom <= stops[0][0]) return stops[0][1];
        if (zoom >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
        
        for (let i = 0; i < stops.length - 1; i++) {
            if (zoom >= stops[i][0] && zoom < stops[i + 1][0]) {
                const [z0, v0] = stops[i];
                const [z1, v1] = stops[i + 1];
                const t = (zoom - z0) / (z1 - z0);
                return v0 * Math.pow(v1 / v0, base * t);
            }
        }
        return stops[stops.length - 1][1];
    }

    // Helper function to get line width based on zoom and base value
    function getLineWidth(base, zoom) {
        return interpolate(zoom, [
            [6, 0.5 * base],
            [20, 30 * base]
        ]);
    }

    // Helper function to get text size based on zoom
    function getTextSize(zoom, isPlace = false, placeType = '') {
        if (isPlace) {
            if (placeType === 'city' || placeType === 'town') {
                return interpolate(zoom, [
                    [8, 10],
                    [20, 24]
                ], 1.4);
            } else {
                return interpolate(zoom, [
                    [10, 10],
                    [20, 14]
                ], 1.4);
            }
        } else {
            return interpolate(zoom, [
                [10, 8],
                [20, 16]
            ], 1.4);
        }
    }
    
    // Helper function to create text style for features
    function createTextStyle(feature, resolution) {
        const name = feature.get('name');
        if (!name) return null;
        
        const zoom = Math.round(Math.log2(156543.03390625 / resolution));
        const isRoad = feature.get('highway') || feature.get('railway');
        const isWater = feature.get('water') || feature.get('waterway');
        const isPlace = feature.get('place');
        const placeType = feature.get('place');
        
        // Skip text for some features at certain zoom levels
        if (zoom < 12 && !isPlace) return null;
        if (zoom < 14 && !isRoad && !isPlace) return null;
        
        // Simplified text style to avoid getScaleArray error
        return new ol.style.Text({
            text: name,
            font: '12px Arial',
            fill: new ol.style.Fill({
                color: isWater ? '#1a5a96' : '#333'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
            }),
            offsetY: isWater ? 5 : 0,
            textAlign: 'center',
            textBaseline: 'middle',
            placement: isRoad ? 'line' : 'point',
            maxAngle: isRoad ? 0.5 : 0
        });
    }

    // Main style function for Maptiler Basic
    function maptilerBasicStyle(feature, resolution) {
        if (!feature || !feature.getGeometry || typeof resolution !== 'number') {
            return [];
        }

        const layer = feature.get('layer') || '';
        const type = feature.getGeometry().getType();
        const styles = [];
        const currentZoom = getZoom(resolution);
        const zoom = Math.floor(currentZoom);
        const isTunnel = feature.get('brunnel') === 'tunnel';
        const isBridge = feature.get('brunnel') === 'bridge';
        const featureClass = feature.get('class') || '';
        const subclass = feature.get('subclass') || '';
        const isLine = type === 'LineString' || type === 'MultiLineString';
        const isPolygon = type === 'Polygon' || type === 'MultiPolygon';
        const isPoint = type === 'Point' || type === 'MultiPoint';
        
        // Background (applied first, at the bottom)
        if (layer === 'background') {
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'hsl(47, 26%, 88%)' // Light beige background
                })
            }));
        }

        // Water features
        if ((layer === 'water' || feature.get('water')) && isPolygon) {
            const isIntermittent = feature.get('intermittent') === 1;
            
            // Water areas
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'hsl(205, 56%, 73%)',
                    opacity: isIntermittent ? 0.7 : 1.0
                })
            }));
        }
        
        // Waterways (rivers, streams)
        else if ((layer === 'waterway' || (layer === 'water' && isLine)) && zoom >= 8) {
            const isIntermittent = feature.get('intermittent') === 1;
            const isTunnel = feature.get('brunnel') === 'tunnel';
            
            if (isTunnel) {
                // Skip rendering water tunnels
                return styles;
            }
            
            const width = getLineWidth(1.0, zoom);
            
            styles.push(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'hsl(205, 56%, 73%)',
                    width: isIntermittent ? width * 0.8 : width,
                    lineDash: isIntermittent ? [2, 1] : null,
                    lineCap: 'round',
                    lineJoin: 'round'
                }),
                zIndex: 1
            }));
        }
        
        // Landcover
        else if (layer === 'landcover' || layer === 'landuse') {
            let fillColor;
            let opacity = 1.0;
            
            // Landcover classes
            if (featureClass === 'grass' || subclass === 'grass') {
                fillColor = 'hsl(82, 46%, 72%)';
                opacity = 0.45;
            } 
            else if (featureClass === 'wood' || subclass === 'wood') {
                fillColor = 'hsl(82, 46%, 72%)';
                opacity = interpolate(zoom, [[8, 0.6], [22, 1]]);
            }
            else if (subclass === 'glacier') {
                fillColor = 'hsl(47, 22%, 94%)';
                opacity = interpolate(zoom, [[0, 1], [8, 0.5]]);
            }
            else if (featureClass === 'sand' || subclass === 'sand') {
                fillColor = 'rgba(232, 214, 38, 1)';
                opacity = 0.3;
            }
            else if (featureClass === 'national_park' || subclass === 'national_park') {
                fillColor = '#E1EBB0';
                opacity = interpolate(zoom, [[5, 0], [9, 0.75]]);
            }
            // Landuse classes
            else if (featureClass === 'residential' || featureClass === 'suburb' || featureClass === 'neighbourhood') {
                fillColor = 'hsl(47, 13%, 86%)';
                opacity = 0.7;
            }
            else if (featureClass === 'agriculture') {
                fillColor = '#eae0d0';
            }
            
            if (fillColor) {
                styles.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: fillColor,
                        opacity: opacity
                    })
                }));
            }
        }
        // Transportation features (roads, paths, etc.)
        else if ((layer === 'transportation' || feature.get('highway') || feature.get('railway')) && isLine) {
            const roadClass = feature.get('class') || feature.get('highway') || feature.get('railway') || '';
            let width, color, dash, lineCap, lineJoin, zIndex = 10;
            
            // Skip if it's a tunnel (handled separately)
            if (isTunnel) {
                // Skip rendering tunnels for now, will be handled in the tunnel section
                return styles;
            }
            
            // Set line style properties based on road class
            lineCap = 'round';
            lineJoin = 'round';
            
            // Road classification and styling
            if (roadClass === 'motorway' || roadClass === 'trunk' || roadClass === 'primary') {
                color = '#fff';
                width = getLineWidth(1.4, zoom);
                zIndex = 30;
            } 
            else if (roadClass === 'secondary' || roadClass === 'tertiary') {
                color = '#fff';
                width = getLineWidth(1.4, zoom) * 0.8;
                zIndex = 25;
            }
            else if (roadClass === 'minor' || roadClass === 'service' || roadClass === 'residential') {
                color = '#f8f8f8';
                width = getLineWidth(1.0, zoom) * 0.6;
                zIndex = 20;
                // Only show minor roads at higher zoom levels
                if (zoom < 13) return styles;
            }
            else if (roadClass === 'path' || roadClass === 'track' || roadClass === 'footway' || roadClass === 'pedestrian') {
                color = '#f8f8f8';
                width = getLineWidth(0.8, zoom) * 0.4;
                dash = [1, 1];
                zIndex = 15;
                // Only show paths at higher zoom levels
                if (zoom < 14) return styles;
            }
            // Railway
            else if (roadClass === 'rail' || roadClass === 'transit') {
                color = 'hsl(34, 12%, 66%)';
                width = 1.5;
                dash = [2, 2];
                zIndex = 5;
                // Only show railways at higher zoom levels
                if (zoom < 11) return styles;
                if (zoom >= 16) dash = null; // Solid line at high zoom
            }
            
            // Apply bridge styling if applicable
            if (isBridge) {
                // Add a casing for bridges
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#dedede',
                        width: width + 2,
                        lineCap: lineCap,
                        lineJoin: lineJoin
                    }),
                    zIndex: zIndex - 1
                }));
            }
            
            // Add the main road line
            styles.push(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: color,
                    width: width,
                    lineCap: lineCap,
                    lineJoin: lineJoin,
                    lineDash: dash
                }),
                zIndex: zIndex
            }));
        }
        
        // Tunnels (handled separately to ensure they're drawn under bridges)
        else if (isTunnel && (layer === 'transportation' || feature.get('highway'))) {
            const roadClass = feature.get('class') || feature.get('highway') || '';
            let width, color, dash, zIndex = 5;
            
            // Set line style properties based on road class
            if (roadClass === 'motorway' || roadClass === 'trunk' || roadClass === 'primary') {
                color = '#fff';
                width = getLineWidth(1.4, zoom) * 0.8;
                dash = [0.28, 0.14];
            } 
            else if (roadClass === 'secondary' || roadClass === 'tertiary') {
                color = '#efefef';
                width = getLineWidth(1.4, zoom) * 0.6;
                dash = [0.36, 0.18];
            }
            else if (roadClass === 'minor' || roadClass === 'service' || roadClass === 'residential') {
                color = '#f0f0f0';
                width = getLineWidth(1.0, zoom) * 0.4;
                dash = [0.4, 0.2];
                if (zoom < 13) return styles;
            }
            
            if (width && color) {
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: width,
                        lineCap: 'butt',
                        lineJoin: 'miter',
                        lineDash: dash
                    }),
                    zIndex: zIndex
                }));
            }
        }
        
        // Buildings
        else if ((layer === 'building' || feature.get('building')) && isPolygon) {
            // Only show buildings at higher zoom levels
            if (zoom < 13) return styles;
            
            // Get building height (default to 0 if not available)
            const height = Number(feature.get('height') || feature.get('levels') || 0) * 3 || 5;
            
            // Calculate opacity based on zoom and height
            const opacity = interpolate(zoom, [
                [13, 0],
                [15, 0.5]
            ]);
            
            // Add building fill
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(222, 211, 190, ' + opacity + ')'
                }),
                stroke: zoom >= 16 ? new ol.style.Stroke({
                    color: 'rgba(212, 177, 146, 0.5)',
                    width: 0.5
                }) : null,
                zIndex: 10 + Math.min(Math.floor(height / 2), 20) // Taller buildings on top
            }));
        }
        
        // Labels
        else if (layer === 'place' && isPoint) {
            const placeType = feature.get('class');
            const name = feature.get('name');
            
            if (!name) return styles;
            
            let textSize, textColor, textHalo, textFont, textOffsetY = 0;
            
            // Style based on place type
            switch (placeType) {
                case 'city':
                    if (zoom < 3) return styles;
                    textSize = interpolate(zoom, [[3, 12], [8, 22]]);
                    textColor = 'hsl(0, 0%, 0%)';
                    textHalo = new ol.style.Stroke({
                        color: 'hsla(0, 0%, 100%, 0.75)',
                        width: 2
                    });
                    textFont = 'bold ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                    break;
                    
                case 'town':
                    if (zoom < 8) return styles;
                    textSize = interpolate(zoom, [[8, 10], [16, 16]]);
                    textColor = 'hsl(0, 0%, 25%)';
                    textHalo = new ol.style.Stroke({
                        color: 'hsl(0, 0%, 100%)',
                        width: 2
                    });
                    textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                    break;
                    
                default:
                    if (zoom < 12) return styles;
                    textSize = interpolate(zoom, [[12, 10], [16, 14]]);
                    textColor = 'hsl(0, 0%, 45%)';
                    textHalo = new ol.style.Stroke({
                        color: 'hsl(0, 0%, 100%)',
                        width: 1.5
                    });
            }
        }
        
        // Add text/labels for features with names using the createTextStyle function
        const textStyle = createTextStyle(feature, resolution);
        if (textStyle) {
            styles.push(new ol.style.Style({
                text: textStyle,
                zIndex: 1000  // Ensure text is on top
            }));
        }
                } else if (isRoad) {
                    fontSize = 8 + Math.min(6, (zoom - 12) * 0.6);
                    textColor = '#333';
                    strokeColor = 'rgba(255,255,255,0.9)';
                } else if (isWater) {
                    fontSize = 10 + Math.min(6, (zoom - 12) * 0.6);
                    textColor = '#1a5a96';
                    strokeColor = 'rgba(255,255,255,0.8)';
                    offsetY = 5;
                } else {
                    fontSize = 10 + Math.min(4, (zoom - 14) * 0.5);
                    textColor = '#333';
                    strokeColor = 'rgba(255,255,255,0.8)';
                }
                
                // Create text style
                const textStyle = new ol.style.Text({
                    text: name,
                    font: `${fontWeight} ${fontSize}px Arial, sans-serif`,
                    fill: new ol.style.Fill({ color: textColor }),
                    stroke: new ol.style.Stroke({
                        color: strokeColor,
                        width: 2
                    }),
                    offsetY: offsetY,
                    overflow: true,
                    placement: isRoad ? 'line' : 'point',
                    maxAngle: isRoad ? 0.5 : 0,
                    textBaseline: 'middle',
                    textAlign: 'center',
                    padding: [2, 4],
                    backgroundFill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.7)'
                    }),
                    backgroundStroke: new ol.style.Stroke({
                        color: 'rgba(200, 200, 200, 0.5)',
                        width: 1
                    })
                });

                styles.push(new ol.style.Style({
                    text: textStyle,
                    zIndex: 1000  // Ensure text is on top
                }));
            }
        }
        
        // Return the collected styles
        return styles;
    }

// Apply bridge styling if applicable
if (isBridge) {
    // Add a casing for bridges
    styles.push(new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#dedede',
            width: width + 2,
            lineCap: lineCap,
            lineJoin: lineJoin
        }),
        zIndex: zIndex - 1
    }));
}

// Add the main road line
styles.push(new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: color,
        width: width,
        lineCap: lineCap,
        lineJoin: lineJoin,
        lineDash: dash
    }),
    zIndex: zIndex
}));

// Tunnels (handled separately to ensure they're drawn under bridges)
else if (isTunnel && (layer === 'transportation' || feature.get('highway'))) {
    const roadClass = feature.get('class') || feature.get('highway') || '';
    let width, color, dash, zIndex = 5;

    // Set line style properties based on road class
    if (roadClass === 'motorway' || roadClass === 'trunk' || roadClass === 'primary') {
        color = '#fff';
        width = getLineWidth(1.4, zoom) * 0.8;
        dash = [0.28, 0.14];
    } else if (roadClass === 'secondary' || roadClass === 'tertiary') {
        color = '#efefef';
        width = getLineWidth(1.4, zoom) * 0.6;
        dash = [0.36, 0.18];
    } else if (roadClass === 'minor' || roadClass === 'service' || roadClass === 'residential') {
        color = '#f0f0f0';
        width = getLineWidth(1.0, zoom) * 0.4;
        dash = [0.4, 0.2];
        if (zoom < 13) return styles;
    }

    if (width && color) {
        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: color,
                width: width,
                lineCap: 'butt',
                lineJoin: 'miter',
                lineDash: dash
            }),
            zIndex: zIndex
        }));
    }
}

// Buildings
else if ((layer === 'building' || feature.get('building')) && isPolygon) {
    // Only show buildings at higher zoom levels
    if (zoom < 13) return styles;

    // Get building height (default to 0 if not available)
    const height = Number(feature.get('height') || feature.get('levels') || 0) * 3 || 5;

    // Calculate opacity based on zoom and height
    const opacity = interpolate(zoom, [
        [13, 0],
        [15, 0.5]
    ]);

    // Add building fill
    styles.push(new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(222, 211, 190, ' + opacity + ')'
        }),
        stroke: zoom >= 16 ? new ol.style.Stroke({
            color: 'rgba(212, 177, 146, 0.5)',
            width: 0.5
        }) : null,
        zIndex: 10 + Math.min(Math.floor(height / 2), 20) // Taller buildings on top
    }));
}

// Labels
else if (layer === 'place' && isPoint) {
    const placeType = feature.get('class');
    const name = feature.get('name');

    if (!name) return styles;

    let textSize, textColor, textHalo, textFont, textOffsetY = 0;

    // Style based on place type
    switch (placeType) {
        case 'city':
            if (zoom < 3) return styles;
            textSize = interpolate(zoom, [[3, 12], [8, 22]]);
            textColor = 'hsl(0, 0%, 0%)';
            textHalo = new ol.style.Stroke({
                color: 'hsla(0, 0%, 100%, 0.75)',
                width: 2
            });
            textFont = 'bold ' + textSize + 'px "Noto Sans", Arial, sans-serif';
            break;

        case 'town':
            if (zoom < 8) return styles;
            textSize = interpolate(zoom, [[8, 10], [16, 16]]);
            textColor = 'hsl(0, 0%, 25%)';
            textHalo = new ol.style.Stroke({
                color: 'hsl(0, 0%, 100%)',
                width: 2
            });
            textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
            break;

        default:
            if (zoom < 12) return styles;
            textSize = interpolate(zoom, [[12, 10], [16, 14]]);
            textColor = 'hsl(0, 0%, 45%)';
            textHalo = new ol.style.Stroke({
                color: 'hsl(0, 0%, 100%)',
                width: 1.5
            });
            textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
    }

    // Add text style if name exists and zoom level is appropriate
    if (name && currentZoom >= 12) {
        styles.push(new ol.style.Style({
            text: new ol.style.Text({
                text: name,
                font: textFont,
                fill: new ol.style.Fill({ color: textColor }),
                stroke: textHalo,
                offsetY: textOffsetY,
                overflow: true,
                scale: 1.0,
                rotation: 0
            }),
            zIndex: 100
        }));
    }
}

// Return the collected styles
return styles;
}

// Register the style
if (typeof window !== 'undefined') {
    window.vectorTileStyles = window.vectorTileStyles || {};
    window.vectorTileStyles['maptiler-basic'] = maptilerBasicStyle;
}

// Export for CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { maptilerBasicStyle };
}
                    dash = isTunnel ? [0.28, 0.14] : null;
                    break;
                case 'minor_road':
                case 'service':
                case 'residential':
                    width = getLineWidth(1.55, resolution);
                    color = isTunnel ? '#efefef' : (isBridge ? '#efefef' : '#fff');
                    dash = isTunnel ? [0.36, 0.18] : null;
                    break;
                case 'path':
                case 'footway':
                case 'pedestrian':
                    width = getLineWidth(1.55, resolution);
                    color = 'hsl(0, 0%, 97%)';
                    dash = [1, 1];
                    break;
                case 'rail':
                case 'railway':
                    width = getLineWidth(1.5, resolution);
                    color = 'hsl(34, 12%, 66%)';
                    dash = isTunnel ? [3, 3] : null;
                    break;
                case 'transit':
                    width = getLineWidth(1.5, resolution);
                    color = 'hsl(34, 12%, 66%)';
                    dash = isTunnel ? [3, 3] : null;
                    break;
                default:
                    width = 1;
                    color = '#fff';
            }

            // Add the line style
            if (width > 0) {
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: width,
                        lineDash: dash,
                        lineCap: lineCap,
                        lineJoin: lineJoin
                    })
                }));
            }
        }
        // Landuse and natural features
        else if (layer === 'landuse' || layer === 'natural' || feature.get('landuse') || feature.get('natural')) {
            const landuseType = feature.get('subclass') || feature.get('class') || feature.get('landuse') || feature.get('natural') || '';
            let fillColor = 'rgba(200, 250, 200, 0.3)'; // Default green for parks
            let opacity = 1.0;
            
            // Set fill color and opacity based on landuse type
            switch(landuseType) {
                // Residential areas
                case 'residential':
                case 'suburb':
                case 'neighbourhood':
                    fillColor = 'hsl(47, 13%, 86%)';
                    opacity = 0.7;
                    break;
                // Parks and green areas
                case 'grass':
                case 'park':
                case 'garden':
                case 'village_green':
                    fillColor = 'hsl(82, 46%, 72%)';
                    opacity = currentZoom < 14 ? 0.45 : 0.6;
                    break;
                // Forests and woodlands
                case 'wood':
                case 'forest':
                    fillColor = 'hsl(82, 46%, 72%)';
                    opacity = Math.min(0.6 + (currentZoom - 8) * 0.05, 1.0);
                    break;
                // Water features
                case 'water':
                case 'pond':
                case 'lake':
                    fillColor = 'hsl(205, 56%, 73%)';
                    break;
                // Commercial areas
                case 'commercial':
                case 'retail':
                case 'industrial':
                    fillColor = 'hsl(30, 20%, 85%)';
                    break;
                // Agricultural areas
                case 'farmland':
                case 'farm':
                case 'orchard':
                case 'vineyard':
                    fillColor = 'hsl(75, 40%, 85%)';
                    break;
                // Sand and beaches
                case 'sand':
                case 'beach':
                case 'dune':
                    fillColor = 'rgba(232, 214, 38, 0.3)';
                    break;
                // Wetlands
                case 'wetland':
                case 'marsh':
                case 'swamp':
                    fillColor = 'hsl(180, 30%, 85%)';
                    break;
                // National parks and protected areas
                case 'national_park':
                case 'protected_area':
                    fillColor = 'hsl(75, 60%, 85%)';
                    break;
                // Default case
                default:
                    fillColor = 'rgba(200, 200, 200, 0.3)';
            }
            
            // Only show landuse at higher zoom levels for better performance
            if (currentZoom >= 12 || landuseType === 'national_park' || landuseType === 'protected_area') {
                styles.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: fillColor,
                        opacity: opacity
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.1)',
                        width: 0.5
                    })
                }));
            }
        }
        // Boundaries
        else if (layer === 'boundary' || feature.get('boundary')) {
            const adminLevel = feature.get('admin_level') || 2;
            let color, width, dash;
            
            // Style based on admin level
            switch(adminLevel) {
                case 2: // Country
                    color = 'hsl(0, 0%, 60%)';
                    width = 1.5;
                    dash = [2, 2];
                    break;
                case 4: // State/Region
                    color = 'hsl(0, 0%, 70%)';
                    width = 1;
                    dash = [4, 2];
                    break;
                case 6: // County
                case 8: // City
                    color = 'hsl(0, 0%, 80%)';
                    width = 0.75;
                    dash = [2, 2];
                    break;
                default:
                    color = 'hsl(0, 0%, 85%)';
                    width = 0.5;
                    dash = [1, 1];
            }
            
            // Only show boundaries at appropriate zoom levels
            const minZoom = Math.max(2, 10 - adminLevel);
            if (currentZoom >= minZoom) {
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: width,
                        lineDash: dash,
                        lineCap: 'round',
                        lineJoin: 'round'
                    })
                }));
            }
        }
        // Buildings
        else if (layer === 'building' || feature.get('building')) {
            // Only show buildings at higher zoom levels for better performance
            if (currentZoom >= 14) {
                const height = feature.get('height') || 0;
                const minOpacity = 0.4;
                const maxOpacity = 0.9;
                
                // Calculate opacity based on building height (taller buildings are more opaque)
                const opacity = height > 0 
                    ? Math.min(minOpacity + (height / 100) * 0.5, maxOpacity)
                    : minOpacity;
                
                // Calculate color variation based on building type
                let fillColor;
                const buildingType = feature.get('building') || 'yes';
                
                switch(buildingType) {
                    case 'residential':
                        fillColor = 'hsl(30, 20%, 85%)';
                        break;
                    case 'commercial':
                    case 'retail':
                        fillColor = 'hsl(0, 30%, 90%)';
                        break;
                    case 'industrial':
                        fillColor = 'hsl(0, 0%, 80%)';
                        break;
                    case 'school':
                    case 'university':
                        fillColor = 'hsl(200, 30%, 90%)';
                        break;
                    case 'hospital':
                        fillColor = 'hsl(0, 50%, 95%)';
                        break;
                    default:
                        fillColor = 'hsl(30, 10%, 85%)';
                }
                
                styles.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: fillColor,
                        opacity: opacity
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(120, 110, 100, 0.3)',
                        width: 0.5,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: Math.min(Math.floor(height / 2), 20) // Taller buildings on top
                }));
            }
        }
        // Shops and amenities
        else if (feature.get('shop') || feature.get('amenity')) {
                const shopType = feature.get('shop');
                const amenityType = feature.get('amenity');
                let iconName = 'shop'; // Default icon
                
                // Map common OSM tags to sprite names
                if (shopType) {
                    // For shops, use the shop type as the icon name
                    iconName = shopType === 'supermarket' ? 'grocery' : shopType;
                } else if (amenityType) {
                    // Map common amenities to their corresponding icons
                    const amenityIcons = {
                        'cafe': 'cafe',
                        'restaurant': 'restaurant',
                        'fast_food': 'fast_food',
                        'bar': 'bar',
                        'pub': 'beer',
                        'bank': 'bank',
                        'pharmacy': 'pharmacy',
                        'hospital': 'hospital',
                        'dentist': 'dentist',
                        'doctors': 'doctors',
                        'cinema': 'cinema',
                        'theatre': 'theatre',
                        'school': 'school',
                        'university': 'college',
                        'library': 'library',
                        'post_office': 'post',
                        'police': 'police',
                        'fire_station': 'fire_station',
                        'place_of_worship': 'place_of_worship',
                        'fuel': 'fuel',
                        'parking': 'parking',
                        'toilets': 'toilets',
                        'fountain': 'fountain',
                        'atm': 'atm',
                        'ice_cream': 'ice_cream',
                        'post_box': 'post',
                        'recycling': 'recycling',
                        'telephone': 'telephone',
                        'vending_machine': 'vending_machine',
                        'bench': 'bench',
                        'waste_basket': 'waste_basket',
                        'bicycle_parking': 'bicycle_parking',
                        'motorcycle_parking': 'motorcycle_parking',
                        'taxi': 'taxi',
                        'bus_station': 'bus_stop',
                        'bicycle_rental': 'bicycle_rental',
                        'car_rental': 'car_rental',
                        'car_wash': 'car_wash',
                        'car_repair': 'car_repair',
                        'kindergarten': 'school',
                        'childcare': 'school',
                        'nursing_home': 'nursing_home',
                        'clinic': 'hospital',
                        'veterinary': 'veterinary',
                        'arts_centre': 'art_gallery',
                        'gallery': 'art_gallery',
                        'museum': 'museum',
                        'courthouse': 'town_hall',
                        'townhall': 'town_hall',
                        'prison': 'prison',
                        'embassy': 'embassy',
                        'community_centre': 'community',
                        'youth_centre': 'youth_centre',
                        'sports_centre': 'stadium',
                        'stadium': 'stadium',
                        'swimming_pool': 'swimming_pool',
                        'golf_course': 'golf',
                        'pitch': 'soccer',
                        'track': 'racetrack',
                        'swimming_area': 'swimming',
                        'water_park': 'water_park',
                        'marina': 'harbor',
                        'picnic_site': 'picnic_site',
                        'bbq': 'bbq',
                        'shelter': 'shelter',
                        'hut': 'hut',
                        'fountain': 'fountain',
                        'clock': 'clock',
                        'waste_disposal': 'waste_basket',
                        'recycling': 'recycling',
                        'vending_machine': 'vending_machine',
                        'bench': 'bench',
                        'drinking_water': 'drinking_water',
                        'toilets': 'toilets',
                        'shower': 'shower',
                        'telephone': 'telephone',
                        'post_box': 'post',
                        'post_office': 'post',
                        'pharmacy': 'pharmacy',
                        'hospital': 'hospital',
                        'doctors': 'doctors',
                        'dentist': 'dentist',
                        'veterinary': 'veterinary',
                        'clinic': 'hospital',
                        'nursing_home': 'nursing_home',
                        'childcare': 'school',
                        'kindergarten': 'school',
                        'school': 'school',
                        'college': 'college',
                        'university': 'college',
                        'library': 'library',
                        'townhall': 'town_hall',
                        'courthouse': 'town_hall',
                        'embassy': 'embassy',
                        'prison': 'prison',
                        'fire_station': 'fire_station',
                        'police': 'police',
                        'post_office': 'post',
                        'telephone': 'telephone',
                        'place_of_worship': 'place_of_worship',
                        'bank': 'bank',
                        'atm': 'atm',
                        'restaurant': 'restaurant',
                        'fast_food': 'fast_food',
                        'cafe': 'cafe',
                        'bar': 'bar',
                        'pub': 'beer',
                        'nightclub': 'nightclub',
                        'cinema': 'cinema',
                        'theatre': 'theatre',
                        'arts_centre': 'art_gallery',
                        'gallery': 'art_gallery',
                        'museum': 'museum',
                        'stadium': 'stadium',
                        'sports_centre': 'stadium',
                        'swimming_pool': 'swimming_pool',
                        'golf_course': 'golf',
                        'pitch': 'soccer',
                        'track': 'racetrack',
                        'swimming_area': 'swimming',
                        'water_park': 'water_park',
                        'marina': 'harbor',
                        'picnic_site': 'picnic_site',
                        'bbq': 'bbq',
                        'shelter': 'shelter',
                        'hut': 'hut',
                        'fountain': 'fountain',
                        'clock': 'clock',
                        'waste_disposal': 'waste_basket',
                        'recycling': 'recycling',
                        'vending_machine': 'vending_machine',
                        'bench': 'bench',
                        'drinking_water': 'drinking_water',
                        'toilets': 'toilets',
                        'shower': 'shower',
                        'telephone': 'telephone',
                        'post_box': 'post',
                        'post_office': 'post',
                        'pharmacy': 'pharmacy',
                        'hospital': 'hospital',
                        'doctors': 'doctors',
                        'dentist': 'dentist',
                        'veterinary': 'veterinary',
                        'clinic': 'hospital',
                        'nursing_home': 'nursing_home',
                        'childcare': 'school',
                        'kindergarten': 'school',
                        'school': 'school',
                        'college': 'college',
                        'university': 'college',
                        'library': 'library',
                        'townhall': 'town_hall',
                        'courthouse': 'town_hall',
                        'embassy': 'embassy',
                        'prison': 'prison',
                        'fire_station': 'fire_station',
                        'police': 'police',
                        'post_office': 'post',
                        'telephone': 'telephone',
                        'place_of_worship': 'place_of_worship',
                        'bank': 'bank',
                        'atm': 'atm',
                        'restaurant': 'restaurant',
                        'fast_food': 'fast_food',
                        'cafe': 'cafe',
                        'bar': 'bar',
                        'pub': 'beer',
                        'nightclub': 'nightclub',
                        'cinema': 'cinema',
                        'theatre': 'theatre'
                    };
                    
                    iconName = amenityIcons[amenityType] || 'marker';
                }
                
                // Common sprite configuration
                const spriteConfig = {
                    'shop': 'shop',
                    'cafe': 'cafe',
                    'restaurant': 'restaurant',
                    'fast_food': 'fast_food',
                    'bar': 'bar',
                    'pub': 'beer',
                    'bank': 'bank',
                    'atm': 'atm',
                    'pharmacy': 'pharmacy',
                    'hospital': 'hospital',
                    'doctors': 'doctors',
                    'dentist': 'dentist',
                    'veterinary': 'veterinary',
                    'post': 'post',
                    'police': 'police',
                    'fire_station': 'fire_station',
                    'school': 'school',
                    'college': 'college',
                    'university': 'college',
                    'library': 'library',
                    'cinema': 'cinema',
                    'theatre': 'theatre',
                    'marker': 'marker'
                };

                // Get the icon name from the config or use default
                const spriteName = spriteConfig[iconName] || 'marker';
                
                // Add icon style with direct sprite URL and color
                styles.push(new ol.style.Style({
                    image: new ol.style.Icon({
                        src: `https://api.maptiler.com/maps/streets-v2/sprite.png#${spriteName}`,
                        color: iconColor || '#333333',
                        scale: 1,
                        anchor: [0.5, 1],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                        opacity: 1,
                        rotation: 0,
                        rotateWithView: false,
                        crossOrigin: 'anonymous'
                    })
                }));
                
                // Add text label for the shop/amenity if it has a name
                const name = feature.get('name');
                if (name) {
                    // Get current zoom level from resolution (approximate)
                    const zoom = Math.round(Math.log2(156543.03390625 / resolution));
                    
                    // At zoom 15, only show one name per street (no shops)
                    if (zoom === 15 && (feature.get('shop') || feature.get('amenity'))) {
                        return styles;
                    }
                    
                    // Determine text size and placement based on zoom level
                    let fontSize, offsetY, maxWidth, padding, textBaseline, declutter = true;
                    
                    if (zoom >= 18) { // Very close zoom (all text, no declutter)
                        fontSize = '12px';
                        offsetY = 15;
                        maxWidth = 200;
                        padding = [3, 6];
                        textBaseline = 'top';
                        declutter = false; // Allow text to be closer together
                    } else if (zoom >= 16) { // Medium zoom
                        fontSize = '11px';
                        offsetY = 14;
                        maxWidth = 150;
                        padding = [2, 5];
                        textBaseline = 'top';
                    } else if (zoom >= 15) { // Zoom 15 (only street names)
                        fontSize = '10px';
                        offsetY = 0;
                        maxWidth = 120;
                        padding = [1, 3];
                        textBaseline = 'middle';
                    } else {
                        // Don't show text at zoom levels below 15
                        return styles;
                    }

                    // For roads, adjust text placement to follow the line
                    const isRoad = feature.get('highway') || layer === 'transportation';
                    if (isRoad && (type === 'LineString' || type === 'MultiLineString')) {
                        textBaseline = 'middle';
                        offsetY = 0;
                    }

                    // Determine colors based on feature type
                    let fillColor, strokeColor, iconColor;
                    const isShop = feature.get('shop');
                    const isAmenity = feature.get('amenity');
                    
                    if (isShop) {
                        fillColor = '#1a237e'; // Deep blue for shops
                        strokeColor = 'rgba(255, 255, 255, 0.9)';
                        iconColor = '#3949ab';
                    } else if (isAmenity) {
                        fillColor = '#2e7d32'; // Green for amenities
                        strokeColor = 'rgba(255, 255, 255, 0.9)';
                        iconColor = '#43a047';
                    } else if (isRoad) {
                        fillColor = '#4a148c'; // Purple for roads
                        strokeColor = 'rgba(255, 255, 255, 0.9)';
                    } else {
                        fillColor = '#333333'; // Default dark gray
                    }

                    // Text/Label styling - This needs to be after other styles so text appears on top
                    const name = feature.get('name');
                    const zoom = Math.round(Math.log2(156543.03390625 / resolution));
                    
                    if (name && zoom >= 10) {  // Only show text at zoom level 10 and above
                        const isRoad = feature.get('highway') || feature.get('railway');
                        const isWater = feature.get('water') || feature.get('waterway');
                        const isPlace = feature.get('place');
                    if (zoom === 15 && isRoad) {
                        // Use a unique identifier for the road to avoid duplicates
                        const roadId = feature.get('ref') || feature.get('name') || '';
                        if (roadId && !window.renderedRoads) {
                            window.renderedRoads = new Set();
                        }
                        
                        if (roadId && window.renderedRoads.has(roadId)) {
                            return styles;
                        }
                        
                        if (roadId) {
                            window.renderedRoads.add(roadId);
                        }
                    }
                }
            }
            // Text/Label styling will be handled at the end
    }

    // Add text style at the end of the style function
    const textStyle = createTextStyle(feature, resolution);
    if (textStyle) {
        styles.push(new ol.style.Style({
            text: textStyle,
            zIndex: 1000
        }));
    }

    return styles;
}

// Register the style
window.vectorTileStyles = window.vectorTileStyles || {};
window.vectorTileStyles['maptiler-basic'] = maptilerBasicStyle;

console.log('Maptiler Basic style with text labels initialized');
})();
