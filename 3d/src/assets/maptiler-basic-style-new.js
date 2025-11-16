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
    if (typeof window !== 'undefined') {
        window.vectorTileStyles = window.vectorTileStyles || {};
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

    // Helper function to get road width based on zoom and class
    function getRoadWidth(roadClass, zoom) {
        const base = {
            'motorway': 1.4,
            'trunk': 1.4,
            'primary': 1.2,
            'secondary': 1.1,
            'tertiary': 1.0,
            'minor_road': 0.8,
            'path': 0.6
        }[roadClass] || 0.8;
        
        // Interpolate width based on zoom level
        return interpolate(zoom, [
            [4, base * 0.25],
            [20, base * 30]
        ]);
    }

    // Helper function to get road properties based on class and zoom
    function getRoadProperties(roadClass, zoom) {
        return interpolate(zoom, [
            [6, 0.5 * base],
            [20, 30 * base]
        ]);
    }

    // Helper function to evaluate filter conditions
    function evaluateFilter(feature, filter) {
        if (!filter) return true;
        if (typeof filter === 'function') return filter(feature);
        if (Array.isArray(filter)) {
            const [operator, ...args] = filter;
            switch (operator) {
                case 'all':
                    return args.every(f => evaluateFilter(feature, f));
                case 'any':
                    return args.some(f => evaluateFilter(feature, f));
                case 'none':
                    return !args.some(f => evaluateFilter(feature, f));
                case '==':
                    return feature.get(args[0]) === args[1];
                case '!=':
                    return feature.get(args[0]) !== args[1];
                case '>':
                    return Number(feature.get(args[0])) > args[1];
                case '>=':
                    return Number(feature.get(args[0])) >= args[1];
                case '<':
                    return Number(feature.get(args[0])) < args[1];
                case '<=':
                    return Number(feature.get(args[0])) <= args[1];
                case 'in':
                    return args.slice(1).includes(feature.get(args[0]));
                case '!in':
                    return !args.slice(1).includes(feature.get(args[0]));
                case 'has':
                    return feature.get(args[0]) !== undefined;
                case '!has':
                    return feature.get(args[0]) === undefined;
                default:
                    return true;
            }
        }
        return true;
    }

    // Style definitions for different layers
    const layerStyles = {
        // Background
        'background': {
            filter: (feature) => feature.get('layer') === 'background',
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(47, 26%, 88%)' // Light beige background
                    })
                })
            ]
        },

        // Landuse - Residential
        'landuse-residential': {
            sourceLayer: 'landuse',
            filter: (feature) => {
                const cls = feature.get('class');
                return ['residential', 'suburb', 'neighbourhood'].includes(cls);
            },
            minZoom: 0,
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(47, 13%, 86%)',
                        opacity: 0.7
                    })
                })
            ]
        },

        // Landcover - Grass
        'landcover-grass': {
            sourceLayer: 'landcover',
            filter: (feature) => feature.get('class') === 'grass',
            minZoom: 0,
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(82, 46%, 72%)',
                        opacity: 0.45
                    })
                })
            ]
        },

        // Water
        'water': {
            sourceLayer: 'water',
            filter: (feature) => {
                return feature.getGeometry().getType() === 'Polygon' && 
                       feature.get('intermittent') !== 1 && 
                       feature.get('brunnel') !== 'tunnel';
            },
            minZoom: 0,
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(205, 56%, 73%)'
                    })
                })
            ]
        },

        // Intermittent Water
        'water-intermittent': {
            sourceLayer: 'water',
            filter: (feature) => {
                return feature.getGeometry().getType() === 'Polygon' && 
                       feature.get('intermittent') === 1;
            },
            minZoom: 0,
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(205, 56%, 73%)',
                        opacity: 0.7
                    })
                })
            ]
        },

        // Bridge - Major roads (primary, secondary, tertiary, trunk)
        'bridge-major': {
            sourceLayer: 'transportation',
            filter: (feature) => {
                const cls = feature.get('class');
                return feature.get('brunnel') === 'bridge' && 
                       ['primary', 'secondary', 'tertiary', 'trunk'].includes(cls);
            },
            minZoom: 6,
            style: (feature, zoom) => {
                const roadClass = feature.get('class');
                const width = getRoadWidth(roadClass, zoom);
                const isMajor = ['motorway', 'trunk', 'primary'].includes(roadClass);
                
                const styles = [];
                
                // Bridge casing (wider line underneath)
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#dedede',
                        width: width * 1.5,
                        lineCap: 'butt',
                        lineJoin: 'miter'
                    }),
                    zIndex: 10 + (isMajor ? 2 : 1)
                }));
                
                // Main bridge line
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: isMajor ? '#ffffff' : '#f8f8f8',
                        width: width,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: 11 + (isMajor ? 2 : 1)
                }));
                
                // Add center line for major roads at higher zoom levels
                if (isMajor && zoom >= 14) {
                    styles.push(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffffff',
                            width: Math.max(0.8, width * 0.15),
                            lineDash: zoom < 16 ? [2, 2] : null,
                            lineCap: 'round',
                            lineJoin: 'round'
                        }),
                        zIndex: 12 + (isMajor ? 2 : 1)
                    }));
                }
                
                return styles;
            }
        },
        
        // Bridge - Minor roads
        'bridge-minor': {
            sourceLayer: 'transportation',
            filter: (feature) => {
                const cls = feature.get('class');
                return feature.get('brunnel') === 'bridge' && 
                       ['minor_road', 'service', 'track'].includes(cls);
            },
            minZoom: 12,
            style: (feature, zoom) => {
                const roadClass = feature.get('class');
                const width = getRoadWidth(roadClass, zoom);
                
                const styles = [];
                
                // Bridge casing (wider line underneath)
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#e8e8e8',
                        width: width * 1.4,
                        lineCap: 'butt',
                        lineJoin: 'miter'
                    }),
                    zIndex: 9
                }));
                
                // Main bridge line
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#f8f8f8',
                        width: width * 0.8,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: 10
                }));
                
                return styles;
            }
        },
        
        // Bridge - Paths and pedestrian ways
        'bridge-path': {
            sourceLayer: 'transportation',
            filter: (feature) => {
                const cls = feature.get('class');
                return feature.get('brunnel') === 'bridge' && 
                       ['path', 'footway', 'cycleway', 'pedestrian', 'steps'].includes(cls);
            },
            minZoom: 14,
            style: (feature, zoom) => {
                const width = getRoadWidth('path', zoom);
                
                return [new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(200, 200, 200, 0.8)',
                        width: width * 0.6,
                        lineCap: 'square',
                        lineJoin: 'miter',
                        lineDash: [1, 1]
                    }),
                    zIndex: 8
                })];
            }
        },
        
        // Bridge - Waterway (for water features that go under bridges)
        'bridge-waterway': {
            sourceLayer: 'waterway',
            filter: (feature) => feature.get('brunnel') === 'bridge',
            minZoom: 12,
            style: (feature, zoom) => {
                const width = interpolate(zoom, [
                    [8, 1],
                    [20, 10]
                ]);
                
                return [new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(170, 211, 223, 0.8)',
                        width: width,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: 7
                })];
            }
        },
        
        // Transportation - Roads
        'road-motorway': {
            sourceLayer: 'transportation',
            filter: (feature) => feature.get('class') === 'motorway',
            minZoom: 6,
            style: (feature, zoom) => {
                const isTunnel = feature.get('brunnel') === 'tunnel';
                const isBridge = feature.get('brunnel') === 'bridge';
                const width = getLineWidth(1.4, zoom);
                
                const styles = [];
                
                // Bridge casing
                if (isBridge) {
                    styles.push(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#e8e8e8',
                            width: width + 2,
                            lineCap: 'round',
                            lineJoin: 'round'
                        }),
                        zIndex: 5
                    }));
                }
                
                // Main road
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: isTunnel ? 'rgba(255, 255, 255, 0.7)' : '#ffffff',
                        width: width,
                        lineCap: isTunnel ? 'butt' : 'round',
                        lineJoin: isTunnel ? 'miter' : 'round',
                        lineDash: isTunnel ? [0.28, 0.14] : null
                    }),
                    zIndex: 6
                }));
                
                return styles;
            }
        },
        
        // Add more road types and other features here...
        
        // Buildings
        'building': {
            sourceLayer: 'building',
            minZoom: 13,
            style: (feature, zoom) => {
                const height = Number(feature.get('height') || feature.get('building:levels') * 3 || 3);
                const opacity = interpolate(zoom, [[13, 0.3], [15, 0.5], [17, 0.7]]);
                
                return [
                    new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: `rgba(222, 211, 190, ${opacity})`
                        }),
                        stroke: zoom >= 16 ? new ol.style.Stroke({
                            color: 'rgba(212, 177, 146, 0.5)',
                            width: 0.5
                        }) : null,
                        zIndex: 10 + Math.min(Math.floor(height / 2), 20)
                    })
                ];
            }
        },
        
        // Labels
        'place-label': {
            sourceLayer: 'place',
            filter: (feature) => feature.get('name'),
            minZoom: 0,
            style: (feature, zoom) => {
                const placeType = feature.get('class');
                const name = feature.get('name');
                let textSize, textColor, textHalo, textFont;
                
                switch (placeType) {
                    case 'city':
                        if (zoom < 3) return [];
                        textSize = getTextSize(zoom, [[3, 12], [8, 16]]);
                        textColor = 'hsl(0, 0%, 0%)';
                        textHalo = new ol.style.Stroke({
                            color: 'hsla(0, 0%, 100%, 0.75)',
                            width: 2
                        });
                        textFont = 'bold ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                        break;
                    case 'town':
                        if (zoom < 8) return [];
                        textSize = getTextSize(zoom, [[8, 10], [16, 16]]);
                        textColor = 'hsl(0, 0%, 25%)';
                        textHalo = new ol.style.Stroke({
                            color: 'hsl(0, 0%, 100%)',
                            width: 2
                        });
                        textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                        break;
                    default:
                        if (zoom < 12) return [];
                        textSize = getTextSize(zoom, [[12, 10], [16, 14]]);
                        textColor = 'hsl(0, 0%, 45%)';
                        textHalo = new ol.style.Stroke({
                            color: 'hsl(0, 0%, 100%)',
                            width: 1.5
                        });
                        textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                }
                
                return [
                    new ol.style.Style({
                        text: new ol.style.Text({
                            text: name,
                            font: textFont,
                            fill: new ol.style.Fill({ color: textColor }),
                            stroke: textHalo,
                            overflow: true
                        }),
                        zIndex: 100
                    })
                ];
            }
        }
    };

    // Main style function
    function getRoadProperties(roadClass, zoom) {
        const props = {
            width: 1.0,
            color: '#ffffff',
            casingWidth: 0,
            casingColor: '#cccccc',
            dash: null,
            minZoom: 0,
            zIndex: 10
        };

        // Define road types and their properties
        const roadTypes = {
            'motorway': {
                width: 1.6, minZoom: 5, zIndex: 15,
                color: '#ffffff', casingWidth: 2.0, casingColor: '#e8e8e8'
            },
            'trunk': {
                width: 1.5, minZoom: 5, zIndex: 14,
                color: '#ffffff', casingWidth: 1.8, casingColor: '#e8e8e8'
            },
            'primary': {
                width: 1.4, minZoom: 7, zIndex: 13,
                color: '#ffffff', casingWidth: 1.6, casingColor: '#e8e8e8'
            },
            'secondary': {
                width: 1.2, minZoom: 9, zIndex: 12,
                color: '#f8f8f8', casingWidth: 1.4, casingColor: '#e0e0e0'
            },
            'tertiary': {
                width: 1.0, minZoom: 10, zIndex: 11,
                color: '#f0f0f0', casingWidth: 1.2, casingColor: '#d8d8d8'
            },
            'residential': {
                width: 0.8, minZoom: 12, zIndex: 10,
                color: '#f8f8f8', casingWidth: 1.0, casingColor: '#e8e8e8'
            },
            'service': {
                width: 0.6, minZoom: 14, zIndex: 9,
                color: '#f8f8f8', casingWidth: 0.8, casingColor: '#f0f0f0'
            },
            'path': {
                width: 0.5, minZoom: 13, zIndex: 5,
                color: '#e8e8e8', dash: [1, 0.5]
            },
            'rail': {
                width: 0.8, minZoom: 10, zIndex: 8,
                color: '#c8c8c8', dash: [2, 2]
            }
        };

        // Find matching road type or use default
        const roadType = roadTypes[roadClass] || roadTypes['service'];
        
        // Adjust width based on zoom level
        const width = getLineWidth(roadType.width, zoom);
        const casingWidth = roadType.casingWidth ? getLineWidth(roadType.casingWidth, zoom) : 0;
        
        return {
            ...roadType,
            width,
            casingWidth,
            visible: zoom >= roadType.minZoom
        };
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
        const sourceLayer = feature.get('layer');
        
        // Process each layer style
        for (const [id, styleDef] of Object.entries(layerStyles)) {
            // Skip if source layer doesn't match
            if (styleDef.sourceLayer && styleDef.sourceLayer !== sourceLayer) {
                continue;
            }
            
            // Skip if below min zoom
            if (styleDef.minZoom !== undefined && zoom < styleDef.minZoom) {
                continue;
            }
            
            // Skip if above max zoom
            if (styleDef.maxZoom !== undefined && zoom > styleDef.maxZoom) {
                continue;
            }
            
            // Skip if filter doesn't match
            if (styleDef.filter && !evaluateFilter(feature, styleDef.filter)) {
                continue;
            }
            
            // Get styles for this feature
            const layerStyles = styleDef.style(feature, zoom);
            if (layerStyles && layerStyles.length > 0) {
                styles.push(...layerStyles);
            }
        }
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
            return styles;
        }

        // Transportation (roads, paths, etc.)
        if ((layer === 'transportation' || feature.get('highway') || feature.get('railway')) && isLine) {
            const roadClass = feature.get('class') || feature.get('highway') || feature.get('railway') || '';
            const roadProps = getRoadProperties(roadClass, zoom);
            const isPath = ['path', 'footway', 'cycleway', 'steps', 'pedestrian', 'track'].includes(roadClass);
            const isMajorRoad = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'].includes(roadClass);
            const isRailway = roadClass === 'rail' || roadClass === 'subway' || roadClass === 'tram';
            
            // Skip if below minimum zoom for this road type
            if (!roadProps.visible) return [];

            // Handle tunnels (rendered first, below other features)
            if (isTunnel) {
                const tunnelColor = roadClass === 'motorway' ? 'rgba(255, 204, 204, 0.7)' : 
                                 roadClass === 'trunk' ? 'rgba(255, 221, 204, 0.7)' : 
                                 'rgba(255, 255, 255, 0.5)';
                
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: tunnelColor,
                        width: roadProps.width * 0.8,
                        lineDash: isMajorRoad ? [1, 0.5] : [0.5, 0.5],
                        lineCap: 'butt',
                        lineJoin: 'miter'
                    }),
                    zIndex: roadProps.zIndex - 5
                }));
                
                // Skip further styling for tunnels
                return styles;
            }
            
            // Handle bridges (rendered on top of other features)
            if (isBridge) {
                // Bridge casing (wider line under the bridge)
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.2)',
                        width: roadProps.width * 1.5,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: roadProps.zIndex + 10
                }));
            }
            
            // Road casing (wider line under the road)
            if (isMajorRoad) {
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: roadProps.casingColor || '#e8e8e8',
                        width: roadProps.width * 1.5,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: roadProps.zIndex - 1
                }));
            }
            
            // Main road line
            const lineStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: isBridge ? roadProps.color : 
                          isPath ? 'rgba(170, 170, 170, 0.8)' : 
                          roadProps.color,
                    width: roadProps.width,
                    lineCap: isPath ? 'square' : 'round',
                    lineJoin: isPath ? 'miter' : 'round',
                    lineDash: isPath ? [1, 1] : null
                }),
                zIndex: isBridge ? roadProps.zIndex + 11 : roadProps.zIndex
            });
            styles.push(lineStyle);
            
            // Add center line for major roads
            if (isMajorRoad && zoom >= 15) {
                const centerLineWidth = Math.max(0.5, roadProps.width * 0.2);
                const centerLineColor = roadClass === 'motorway' ? '#ffffff' : 
                                      roadClass === 'trunk' ? '#fff5f5' : '#ffffff';
                
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: centerLineColor,
                        width: centerLineWidth,
                        lineDash: zoom < 16 ? [2, 1] : null,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: isBridge ? roadProps.zIndex + 12 : roadProps.zIndex + 1
                }));
            }
            
            // Add road labels for major roads
            if (isMajorRoad && zoom >= 13 && feature.get('name')) {
                const labelStyle = new ol.style.Style({
                    text: new ol.style.Text({
                        text: feature.get('name'),
                        font: '12px "Noto Sans", Arial, sans-serif',
                        fill: new ol.style.Fill({
                            color: '#000000'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255, 255, 255, 0.8)',
                            width: 3
                        }),
                        offsetY: -10,
                        overflow: true
                    }),
                    zIndex: 1000
                });
                styles.push(labelStyle);
            }
            
            return styles;
        } // End of transportation layer

        // Water bodies
        if (layer === 'water' && isPolygon) {
            const isIntermittent = feature.get('intermittent') === 1 || feature.get('intermittent') === true;
            
            // Base water style
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: isIntermittent ? 'rgba(170, 211, 223, 0.7)' : 'rgba(170, 211, 223, 0.9)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(150, 191, 203, 0.8)',
                    width: 1
                }),
                zIndex: 1
            }));
            
            // Add wave pattern for large water bodies at higher zoom levels
            if (zoom > 12 && !isIntermittent) {
                const wavePattern = new ol.style.Circle({
                    radius: 3,
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                });
                
                styles.push(new ol.style.Style({
                    image: wavePattern,
                    geometry: function(feature) {
                        // Create a grid of points for the wave pattern
                        const coordinates = [];
                        const geom = feature.getGeometry();
                        const extent = ol.extent.createEmpty();
                        
                        geom.getExtent(extent);
                        const width = ol.extent.getWidth(extent);
                        const height = ol.extent.getHeight(extent);
                        
                        if (width > 50 && height > 50) { // Only for larger water bodies
                            const spacing = 20; // pixels between wave points
                            const x0 = extent[0];
                            const y0 = extent[1];
                            
                            for (let x = x0; x < extent[2]; x += spacing) {
                                for (let y = y0; y < extent[3]; y += spacing) {
                                    if (geom.intersectsCoordinate([x, y])) {
                                        coordinates.push([x, y]);
                                    }
                                }
                            }
                        }
                        
                        return new ol.geom.MultiPoint(coordinates);
                    },
                    zIndex: 2
                }));
            }
            
            return styles;
        }
        
        // Landuse areas
        if ((layer === 'landuse' || layer === 'landcover') && isPolygon) {
            const landClass = feature.get('class') || '';
            let fillColor, opacity = 0.6;
            
            switch (landClass) {
                case 'residential':
                case 'suburb':
                case 'neighbourhood':
                    fillColor = 'hsl(40, 20%, 90%)';
                    break;
                case 'grass':
                case 'grassland':
                case 'meadow':
                    fillColor = 'hsl(82, 46%, 72%)';
                    opacity = 0.4;
                    break;
                case 'park':
                case 'recreation_ground':
                    fillColor = 'hsl(100, 50%, 80%)';
                    opacity = 0.5;
                    break;
                case 'forest':
                case 'wood':
                    fillColor = 'hsl(100, 30%, 70%)';
                    opacity = 0.4;
                    break;
                case 'industrial':
                case 'commercial':
                    fillColor = 'hsl(30, 30%, 85%)';
                    break;
                case 'farmland':
                case 'farm':
                    fillColor = 'hsl(60, 40%, 80%)';
                    opacity = 0.5;
                    break;
                default:
                    return []; // Skip unknown landuse types
            }
            
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: fillColor.replace(')', `, ${opacity})`).replace('hsl', 'hsla')
                }),
                zIndex: 0
            }));
            
            return styles;
        }
        
        // Buildings
        if (layer === 'building' && (isPolygon || isPoint)) {
            const height = Number(feature.get('height') || feature.get('building:levels') * 3 || 3);
            const baseColor = feature.get('color') || '#ddc0a4';
            const opacity = interpolate(zoom, [[13, 0.3], [15, 0.5], [17, 0.7]]);
            
            // Base building shape
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
                }),
                stroke: zoom >= 16 ? new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.2)',
                    width: 0.5
                }) : null,
                zIndex: 10 + Math.min(Math.floor(height / 2), 20)
            }));
            
            // Add 3D effect for buildings at higher zoom levels
            if (zoom >= 15) {
                const roofColor = ol.color.asArray(baseColor).map(c => Math.min(255, c + 20));
                roofColor[3] = opacity * 0.8; // Slightly more transparent for roof
                
                styles.push(new ol.style.Style({
                    geometry: function(feature) {
                        const geom = feature.getGeometry().clone();
                        // Slightly offset the roof for 3D effect
                        geom.translate(0, -0.00002 * height);
                        return geom;
                    },
                    fill: new ol.style.Fill({
                        color: ol.color.asString(roofColor)
                    }),
                    zIndex: 11 + Math.min(Math.floor(height / 2), 20)
                }));
            }
            
            return styles;
        }

        // Water features
        if ((layer === 'water' || feature.get('water')) && isPolygon) {
            const isIntermittent = feature.get('intermittent') === 1;
            
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'hsl(205, 56%, 73%)',
                    opacity: isIntermittent ? 0.7 : 1.0
                })
            }));
            return styles;
        }

        // Landuse and natural features
        if ((layer === 'landuse' || layer === 'natural' || feature.get('landuse') || feature.get('natural')) && isPolygon) {
            const landuseType = feature.get('subclass') || feature.get('class') || feature.get('landuse') || feature.get('natural') || '';
            let fillColor = 'rgba(200, 250, 200, 0.3)'; // Default green for parks
            
            // Set color based on landuse type
            switch (landuseType) {
                case 'residential':
                    fillColor = 'hsl(47, 13%, 86%)';
                    break;
                case 'park':
                case 'grass':
                    fillColor = 'hsl(82, 46%, 72%)';
                    break;
                case 'forest':
                case 'wood':
                    fillColor = 'hsl(82, 34%, 79%)';
                    break;
                case 'industrial':
                    fillColor = 'hsl(0, 0%, 89%)';
                    break;
                case 'commercial':
                    fillColor = 'hsl(0, 0%, 86%)';
                    break;
            }

            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: fillColor
                })
            }));
            return styles;
        }

        // Transportation (roads, paths, etc.)
        if ((layer === 'transportation' || feature.get('highway') || feature.get('railway')) && isLine) {
            const roadClass = feature.get('class') || feature.get('highway') || feature.get('railway') || '';
            let width, color, dash, zIndex = 10;
            
            // Set line style properties based on road class
            if (roadClass === 'motorway' || roadClass === 'trunk' || roadClass === 'primary') {
                width = getLineWidth(1.4, zoom);
                color = isTunnel ? 'rgba(255, 255, 255, 0.7)' : (isBridge ? '#fff' : '#fff');
                dash = isTunnel ? [0.28, 0.14] : null;
                zIndex = 12;
            } 
            else if (roadClass === 'secondary' || roadClass === 'tertiary') {
                width = getLineWidth(1.2, zoom);
                color = isTunnel ? 'rgba(239, 239, 239, 0.7)' : (isBridge ? '#efefef' : '#efefef');
                dash = isTunnel ? [0.36, 0.18] : null;
                zIndex = 11;
            }
            else if (roadClass === 'minor' || roadClass === 'service' || roadClass === 'residential') {
                if (zoom < 13) return [];
                width = getLineWidth(1.0, zoom);
                color = isTunnel ? 'rgba(240, 240, 240, 0.7)' : (isBridge ? '#f0f0f0' : '#f0f0f0');
                dash = isTunnel ? [0.4, 0.2] : null;
                zIndex = 10;
            }
            
            // Add bridge casing
            if (isBridge) {
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#dedede',
                        width: width + 2,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }),
                    zIndex: zIndex - 1
                }));
            }

            // Add the main road line
            if (width && color) {
                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: width,
                        lineCap: isTunnel ? 'butt' : 'round',
                        lineJoin: isTunnel ? 'miter' : 'round',
                        lineDash: dash
                    }),
                    zIndex: zIndex
                }));
            }
            return styles;
        }

        // Buildings
        if ((layer === 'building' || feature.get('building')) && isPolygon) {
            // Only show buildings at higher zoom levels for better performance
            if (zoom < 13) return [];
            
            // Get building properties with defaults
            const height = Number(feature.get('height') || feature.get('building:levels') * 3 || 3);
            const roofShape = feature.get('roof:shape') || 'flat';
            const roofColor = feature.get('roof:color') || 
                            (roofShape === 'flat' ? 'rgba(180, 160, 140, 0.8)' : 'rgba(200, 180, 160, 0.9)');
            
            // Calculate colors based on height
            const baseHue = 30; // Base hue for buildings (orange/brown)
            const heightFactor = Math.min(height / 50, 1); // Normalize height factor (0-1)
            const lightness = 70 - (heightFactor * 15); // Taller buildings are darker
            const saturation = 20 + (heightFactor * 20); // Taller buildings are more saturated
            
            // Base building color
            const baseColor = `hsla(${baseHue}, ${saturation}%, ${lightness}%, `;
            
            // Calculate opacity based on zoom and height
            const opacity = interpolate(zoom, [
                [13, 0.3],
                [15, 0.5],
                [17, 0.7]
            ]) * (0.8 + (heightFactor * 0.4)); // Taller buildings are more opaque
            
            // Shadow effect for 3D appearance (simplified for vector tiles)
            if (zoom >= 15) {
                // Use a simpler shadow effect that doesn't require geometry manipulation
                styles.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 0, 0, ' + (0.05 * opacity) + ')'
                    }),
                    // Use the original geometry without modification
                    // The offset is handled by the style's offset property
                    image: new ol.style.Circle({
                        radius: 0, // No visible circle, just using for the effect
                        offset: [2, 2] // Small offset for shadow effect
                    }),
                    zIndex: 5 + Math.floor(height)
                }));
            }
            
            // Main building fill
            styles.push(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: baseColor + opacity + ')'
                }),
                stroke: zoom >= 16 ? new ol.style.Stroke({
                    color: 'rgba(180, 160, 140, ' + (0.3 + (opacity * 0.5)) + ')',
                    width: 0.5 + (zoom / 50) // Slightly thicker lines when zoomed in
                }) : null,
                zIndex: 10 + Math.floor(height)
            }));
            
            // Roof styling for pitched roofs
            if (roofShape !== 'flat' && zoom >= 16) {
                styles.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: roofColor
                    }),
                    zIndex: 11 + Math.floor(height)
                }));
            }
            
            // Building height label (for very tall buildings)
            if (height > 30 && zoom >= 16) {
                const heightText = Math.round(height) + 'm';
                const textSize = interpolate(zoom, [[16, 10], [20, 14]]);
                
                styles.push(new ol.style.Style({
                    text: new ol.style.Text({
                        text: heightText,
                        font: `bold ${textSize}px "Noto Sans", Arial, sans-serif`,
                        fill: new ol.style.Fill({
                            color: 'rgba(0, 0, 0, 0.8)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255, 255, 255, 0.7)',
                            width: 2
                        }),
                        offsetY: -height / 2,
                        overflow: true
                    }),
                    zIndex: 20 + Math.floor(height)
                }));
            }
            
            return styles;
        }

        // Labels
        if (layer === 'place' && isPoint) {
            const placeType = feature.get('class');
            const name = feature.get('name');
            if (!name) return [];

            let textSize, textColor, textHalo, textFont, textOffsetY = 0;
            
            // Style based on place type
            switch (placeType) {
                case 'city':
                    if (zoom < 3) return [];
                    textSize = interpolate(zoom, [[3, 12], [8, 22]]);
                    textColor = 'hsl(0, 0%, 0%)';
                    textHalo = new ol.style.Stroke({
                        color: 'hsla(0, 0%, 100%, 0.75)',
                        width: 2
                    });
                    textFont = 'bold ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                    break;
                    
                case 'town':
                    if (zoom < 8) return [];
                    textSize = interpolate(zoom, [[8, 10], [16, 16]]);
                    textColor = 'hsl(0, 0%, 25%)';
                    textHalo = new ol.style.Stroke({
                        color: 'hsl(0, 0%, 100%)',
                        width: 2
                    });
                    textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                    break;
                    
                default:
                    if (zoom < 12) return [];
                    textSize = interpolate(zoom, [[12, 10], [16, 14]]);
                    textColor = 'hsl(0, 0%, 45%)';
                    textHalo = new ol.style.Stroke({
                        color: 'hsl(0, 0%, 100%)',
                        width: 1.5
                    });
                    textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
            }
            
            styles.push(new ol.style.Style({
                text: new ol.style.Text({
                    text: name,
                    font: textFont,
                    fill: new ol.style.Fill({ color: textColor }),
                    stroke: textHalo,
                    offsetY: textOffsetY,
                    overflow: true
                }),
                zIndex: 100
            }));
            return styles;
        }

        return [];
    }

    // Register the style function
    window.vectorTileStyles['maptiler-basic'] = maptilerBasicStyle;

    // Export for CommonJS environments
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { maptilerBasicStyle };
    }
})();
