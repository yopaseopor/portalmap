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

    // Sprite metadata cache - load synchronously for immediate availability
    let spriteData = null;

    // Load sprite data synchronously
    if (!spriteData) {
        try {
            // Use XMLHttpRequest for synchronous loading
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'src/assets/sprites/basics/sprites.json', false); // synchronous
            xhr.send();

            if (xhr.status === 200) {
                spriteData = JSON.parse(xhr.responseText);
                console.log('Loaded sprite data:', Object.keys(spriteData).length, 'icons');
            } else {
                console.error('Failed to load sprite data:', xhr.status);
            }
        } catch (err) {
            console.error('Error loading sprite data:', err);
            spriteData = {};
        }
    }

    // Helper function to get icon offset from sprite sheet
    function getIconOffset(iconName) {
        if (!spriteData || !spriteData[iconName]) {
            console.warn('Icon not found in sprite data:', iconName);
            return [0, 0]; // Default to first icon
        }
        const icon = spriteData[iconName];
        return [icon.x, icon.y];
    }

    // Style definitions for different layers
    const layerStyles = {
        // Background
        'background': {
            sourceLayer: 'background',
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(60, 10%, 95%)' // Very light gray for contrast with white roads
                    })
                })
            ]
        },

        // Water bodies (main water)
        'water': {
            sourceLayer: 'water',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return geomType === 'Polygon' &&
                       feature.get('intermittent') !== 1 &&
                       feature.get('brunnel') !== 'tunnel';
            },
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(205, 56%, 73%)' // Water blue
                    }),
                    zIndex: 1
                })
            ]
        },

        // Water bodies (intermittent)
        'water_intermittent': {
            sourceLayer: 'water',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return geomType === 'Polygon' && feature.get('intermittent') === 1;
            },
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(205, 56%, 73%)', // Water blue
                        opacity: 0.7
                    }),
                    zIndex: 1
                })
            ]
        },

        // Waterways (rivers, streams, canals) - BLUE LINE FEATURES
        'waterways': {
            sourceLayer: 'waterway',
            filter: (feature) => {
                return feature.getGeometry().getType() === 'LineString';
            },
            style: (feature, zoom) => {
                const waterwayClass = feature.get('class') || feature.get('waterway') || '';
                let width, color = 'hsl(205, 56%, 73%)', zIndex = 2; // SAME BLUE as water bodies

                // Waterway width scaling with zoom
                const calculateWidth = (minWidth, maxWidth) => {
                    if (zoom <= 8) return minWidth;
                    if (zoom >= 16) return maxWidth;
                    return minWidth + (maxWidth - minWidth) * ((zoom - 8) / 8);
                };

                switch (waterwayClass) {
                    case 'river':
                        width = calculateWidth(1, 6); // Thicker for major rivers
                        zIndex = 4;
                        break;
                    case 'canal':
                        width = calculateWidth(0.8, 5); // Slightly thinner canals
                        zIndex = 3;
                        break;
                    case 'stream':
                    case 'brook':
                    default:
                        width = calculateWidth(0.5, 3); // Thin streams
                        zIndex = 2;
                }

                return [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: color,
                            width: width,
                            lineCap: 'round',
                            lineJoin: 'round'
                        }),
                        zIndex: zIndex
                    })
                ];
            }
        },

        // Landuse areas
        'landuse': {
            sourceLayer: 'landuse',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return geomType === 'Polygon' || geomType === 'MultiPolygon';
            },
            style: (feature, zoom) => {
                const landClass = feature.get('class') || '';
                let fillColor = 'hsl(35, 35%, 85%)'; // LIGHT BROWN for untagged/no class land
                let opacity = 0.5;

                switch (landClass) {
                    case 'residential':
                    case 'suburb':
                    case 'neighbourhood':
                        fillColor = 'hsl(0, 0%, 90%)'; // WHITE for residential areas
                        opacity = 0.6;
                        break;
                    case 'grass':
                    case 'grassland':
                    case 'meadow':
                    case 'greenspace':
                        fillColor = 'hsl(120, 50%, 70%)'; // GREEN grass areas
                        opacity = 0.5;
                        break;
                    case 'park':
                    case 'recreation_ground':
                    case 'garden':
                    case 'cemetery':
                        fillColor = 'hsl(115, 60%, 75%)'; // BRIGHT GREEN for parks/gardens
                        opacity = 0.6;
                        break;
                    case 'protected_area':
                        fillColor = 'hsl(120, 30%, 80%)'; // LIGHT GREEN for protected areas
                        opacity = 0.5;
                        break;
                    case 'forest':
                    case 'wood':
                    case 'natural':
                        fillColor = 'hsl(100, 45%, 65%)'; // DARK GREEN for forests
                        opacity = 0.6;
                        break;
                    case 'industrial':
                    case 'commercial':
                        fillColor = 'hsl(35, 25%, 80%)'; // Light brown
                        opacity = 0.5;
                        break;
                    case 'farmland':
                    case 'farm':
                    case 'agriculture':
                        fillColor = 'hsl(45, 30%, 75%)'; // Brownish yellow for farmland
                        opacity = 0.4;
                        break;
                    case 'water': // Just in case
                        fillColor = 'hsl(205, 56%, 73%)';
                        opacity = 0.7;
                        break;
                    case 'pitch': // Sports fields
                        fillColor = 'hsl(110, 50%, 80%)'; // GREEN for sports pitches
                        opacity = 0.4;
                        break;
                    case 'beach':
                        fillColor = 'hsl(45, 35%, 78%)'; // YELLOWISH BROWN for beaches
                        opacity = 0.5;
                        break;
                }

                return [
                    new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: `hsla(${fillColor.split('hsl(')[1].replace(')', `, ${opacity})`)}`
                        }),
                        zIndex: 0
                    })
                ];
            }
        },

        // Landcover ice shelf (ice sheets)
        'landcover-ice-shelf': {
            sourceLayer: 'landcover',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return (geomType === 'Polygon' || geomType === 'MultiPolygon') &&
                       feature.get('subclass') === 'ice_shelf';
            },
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(47, 26%, 88%)',
                        opacity: 0.8
                    }),
                    zIndex: 0
                })
            ]
        },

        // Landcover glacier
        'landcover-glacier': {
            sourceLayer: 'landcover',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return (geomType === 'Polygon' || geomType === 'MultiPolygon') &&
                       feature.get('subclass') === 'glacier';
            },
            style: (feature, zoom) => {
                // Opacity fades from 1.0 at zoom 0 to 0.5 at zoom 8
                const opacity = zoom <= 0 ? 1.0 : Math.max(0.5, 1.0 - (zoom - 0) * (0.5 / 8));
                return [
                    new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: `hsla(47, 22%, 94%, ${opacity})`
                        }),
                        zIndex: 0
                    })
                ];
            }
        },

        // Landcover sand (beaches from landcover layer)
        'landcover_sand': {
            sourceLayer: 'landcover',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return (geomType === 'Polygon' || geomType === 'MultiPolygon') &&
                       feature.get('class') === 'sand';
            },
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(232, 214, 38, 0.3)' // Yellowish sand color
                    }),
                    zIndex: 0
                })
            ]
        },

        // Landcover grass
        'landcover_grass': {
            sourceLayer: 'landcover',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return (geomType === 'Polygon' || geomType === 'MultiPolygon') &&
                       feature.get('class') === 'grass';
            },
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(82, 46%, 72%)',
                        opacity: 0.45
                    }),
                    zIndex: 0
                })
            ]
        },

        // Landcover wood (forests from landcover layer)
        'landcover_wood': {
            sourceLayer: 'landcover',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                return (geomType === 'Polygon' || geomType === 'MultiPolygon') &&
                       feature.get('class') === 'wood';
            },
            style: (feature, zoom) => {
                // Opacity increases with zoom: 0.6 at zoom 8, increases to 1.0 at zoom 22
                const minZoom = 8, maxZoom = 22;
                const opacity = zoom <= minZoom ? 0.6 :
                               zoom >= maxZoom ? 1.0 :
                               0.6 + (zoom - minZoom) * (0.4 / (maxZoom - minZoom));

                return [
                    new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: `hsla(82, 46%, 72%, ${opacity})`
                        }),
                        zIndex: 0
                    })
                ];
            }
        },

        // Landcover (remaining default landcover features)
        'landcover_default': {
            sourceLayer: 'landcover',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                const landClass = feature.get('class') || '';
                const subClass = feature.get('subclass') || '';

                return (geomType === 'Polygon' || geomType === 'MultiPolygon') &&
                       landClass !== 'wood' &&
                       landClass !== 'grass' &&
                       landClass !== 'sand' &&
                       subClass !== 'ice_shelf' &&
                       subClass !== 'glacier';
            },
            style: (feature, zoom) => [
                new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'hsl(35, 35%, 85%, 0.4)' // LIGHT BROWN default
                    }),
                    zIndex: 0
                })
            ]
        },

        // Buildings
        'buildings': {
            sourceLayer: 'building',
            minZoom: 13,
            filter: (feature) => feature.getGeometry().getType() === 'Polygon',
            style: (feature, zoom) => {
                const height = Number(feature.get('height') || feature.get('building:levels') * 3 || 3);
                const opacity = 0.6;

                return [
                    new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: `hsl(0, 0%, 70%, ${opacity})`  // GREY buildings
                        }),
                        stroke: zoom >= 16 ? new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.2)',
                            width: 0.5
                        }) : undefined,
                        zIndex: 10 + Math.min(Math.floor(height / 2), 20)
                    })
                ];
            }
        },

        // Roads
        'roads': {
            sourceLayer: 'transportation',
            filter: (feature) => feature.getGeometry().getType() === 'LineString',
            style: (feature, zoom) => {
                const roadClass = feature.get('class') || feature.get('highway') || '';
                let width, color = '#ffffff', zIndex = 10;
                let casingColor = '#e8e8e8';
                let casingWidth = 0;

                // Helper function to calculate road width with better scaling
                const calculateWidth = (minWidth, maxWidth) => {
                    // Simple linear scaling based on zoom level
                    // At zoom 8 or below: use minWidth
                    // At zoom 16 and above: use maxWidth
                    // Linear interpolation in between
                    if (zoom <= 8) return minWidth;
                    if (zoom >= 16) return maxWidth;
                    return minWidth + (maxWidth - minWidth) * ((zoom - 8) / 8);
                };

                // Road classification hierarchy - from most important to least
                switch (roadClass) {
                    case 'motorway':
                        width = calculateWidth(3, 12); // Wider for road names: 3px to 12px
                        color = 'hsl(0, 0%, 70%)'; // GREY motorways
                        casingColor = '#d0d0d0';
                        casingWidth = width * 1.4; // Proportional casing
                        zIndex = 20;
                        break;

                    case 'motorway_link': // Ramp roads connecting to motorways
                        width = calculateWidth(2.5, 8); // Narrower than motorway but wider for names
                        color = 'hsl(0, 0%, 75%)'; // GREY link roads
                        casingColor = '#d0d0d0';
                        casingWidth = width * 1.4;
                        zIndex = 19.5; // Just below motorway
                        break;

                    case 'trunk':
                        width = calculateWidth(2.8, 10);
                        color = 'hsl(0, 0%, 75%)'; // GREY trunk roads
                        casingColor = '#d8d8d8';
                        casingWidth = width * 1.35;
                        zIndex = 19;
                        break;

                    case 'trunk_link':
                        width = calculateWidth(2.2, 7); // Narrower than trunk but wider for names
                        color = 'hsl(0, 0%, 75%)'; // GREY link roads
                        casingColor = '#d8d8d8';
                        casingWidth = width * 1.35;
                        zIndex = 18.5;
                        break;

                    case 'primary':
                        width = calculateWidth(2.5, 9);
                        color = 'hsl(0, 0%, 80%)'; // GREY primary roads
                        casingColor = '#e0e0e0';
                        casingWidth = width * 1.3;
                        zIndex = 18;
                        break;

                    case 'primary_link':
                        width = calculateWidth(2, 6); // Narrower than primary but wider for names
                        color = 'hsl(0, 0%, 80%)'; // GREY link roads
                        casingColor = '#e0e0e0';
                        casingWidth = width * 1.3;
                        zIndex = 17.5;
                        break;

                    case 'secondary':
                        width = calculateWidth(2.2, 8);
                        color = 'hsl(0, 0%, 80%)'; // GREY secondary roads
                        casingColor = '#e8e8e8';
                        casingWidth = width * 1.25;
                        zIndex = 17;
                        break;

                    case 'secondary_link':
                        width = calculateWidth(1.8, 6); // Narrower than secondary but wider for names
                        color = 'hsl(0, 0%, 80%)'; // GREY link roads
                        casingColor = '#e8e8e8';
                        casingWidth = width * 1.25;
                        zIndex = 16.5;
                        break;

                    case 'tertiary':
                        width = calculateWidth(2, 7);
                        color = 'hsl(0, 0%, 85%)'; // GREY tertiary roads
                        casingColor = '#e8e8e8';
                        casingWidth = zoom > 12 ? width * 1.2 : 0;
                        zIndex = 16;
                        break;

                    case 'tertiary_link':
                        width = calculateWidth(1.6, 5); // Narrower than tertiary
                        color = 'hsl(0, 0%, 85%)'; // GREY link roads
                        casingColor = '#e8e8e8';
                        casingWidth = zoom > 12 ? width * 1.2 : 0;
                        zIndex = 15.5;
                        break;

                    case 'living_street':
                        width = calculateWidth(1.8, 6);
                        color = '#f8f8f8';
                        casingWidth = 0;
                        zIndex = 15;
                        break;

                    case 'residential':
                        width = calculateWidth(1.5, 5);
                        color = 'hsl(0, 0%, 92%)';
                        casingWidth = 0;
                        zIndex = 14;
                        break;

                    case 'unclassified':
                        width = calculateWidth(1.2, 4);
                        color = 'hsl(0, 0%, 88%)';
                        casingWidth = 0;
                        zIndex = 13;
                        break;

                    case 'service':
                        width = calculateWidth(1, 3);
                        color = 'hsl(0, 0%, 84%)';
                        casingWidth = 0;
                        zIndex = 12;
                        break;

                    case 'track':
                        width = calculateWidth(0.8, 2.5);
                        color = 'hsl(30, 25%, 60%)'; // BROWN for tracks
                        casingWidth = 0;
                        zIndex = 11;
                        break;

                    case 'path':
                    case 'footway':
                    case 'cycleway':
                    case 'pedestrian':
                        width = calculateWidth(0.6, 2);
                        color = 'hsl(30, 20%, 70%)';
                        casingWidth = 0;
                        zIndex = 10;
                        break;

                    case 'steps':
                        width = calculateWidth(0.8, 2.5);
                        color = 'hsl(20, 10%, 65%)';
                        casingWidth = 0;
                        zIndex = 9;
                        break;

                    default:
                        width = calculateWidth(1, 3.5);
                        color = 'hsl(0, 0%, 82%)';
                        casingWidth = 0;
                        zIndex = 8;
                }

                const styles = [];

                // Add casing for major roads with better visibility
                if (casingWidth > 0 && zoom >= 8) {
                    // Only show casing at higher zoom levels for better performance
                    const minZoomForCasing = {
                        'motorway': 6,
                        'trunk': 7,
                        'primary': 8,
                        'secondary': 9,
                        'tertiary': 10
                    };

                    if (zoom >= (minZoomForCasing[roadClass] || 12)) {
                        styles.push(new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: casingColor,
                                width: casingWidth,
                                lineCap: 'round',
                                lineJoin: 'round'
                            }),
                            zIndex: zIndex - 1
                        }));
                    }
                }

                // Main road line
                const mainStroke = {
                    color: color,
                    width: width,
                    lineCap: 'round',
                    lineJoin: 'round'
                };

                // Make tracks dashed
                if (['track', 'path', 'footway', 'cycleway', 'pedestrian'].includes(roadClass) && zoom >= 12) {
                    mainStroke.lineDash = [zoom * 0.5, zoom * 0.5]; // Dashed pattern scales with zoom
                }

                styles.push(new ol.style.Style({
                    stroke: new ol.style.Stroke(mainStroke),
                    zIndex: zIndex
                }));

                return styles;
            }
        },

        // Road name labels - show street names on roads
        'road-label': {
            sourceLayer: 'transportation_name',
            minZoom: 12,
            filter: (feature) => {
                // Only show road names that have a name property
                return feature.get('name') && feature.getGeometry().getType() === 'LineString';
            },
            style: (feature, zoom) => {
                const name = feature.get('name');
                const roadClass = feature.get('class') || feature.get('highway') || '';

                // Adjust text size based on road importance
                let textSize = 12;
                let textColor = 'hsl(0, 0%, 30%)';
                const zIndex = 102;

                // Larger roads get more prominent labels
                if (['motorway', 'trunk'].includes(roadClass)) {
                    textSize = Math.min(14, 11 + (zoom - 12) * 0.3);
                    textColor = 'hsl(0, 0%, 20%)';
                } else if (['primary'].includes(roadClass)) {
                    textSize = Math.min(13, 10 + (zoom - 12) * 0.3);
                    textColor = 'hsl(0, 0%, 25%)';
                } else if (zoom >= 15) {
                    textSize = Math.min(12, 9 + (zoom - 15) * 0.2);
                    textColor = 'hsl(0, 0%, 35%)';
                } else {
                    return []; // Don't show labels for small roads at low zoom
                }

                // Road name labels follow the road geometry
                return [
                    new ol.style.Style({
                        text: new ol.style.Text({
                            text: name,
                            font: `500 ${textSize}px "Noto Sans", Arial, sans-serif`,
                            fill: new ol.style.Fill({ color: textColor }),
                            stroke: new ol.style.Stroke({
                                color: 'hsl(0, 0%, 100%)',
                                width: 1.5
                            }),
                            textBaseline: 'bottom',
                            textAlign: 'center',
                            placement: 'line',
                            overflow: true
                        }),
                        zIndex: zIndex
                    })
                ];
            }
        },

        // POI (Point of Interest) labels with sprite icons
        'poi-label': {
            sourceLayer: 'poi',
            minZoom: 13, // Show major POIs earlier, shops at high zoom only
            style: (feature, zoom) => {
                const name = feature.get('name') || '';
                const poiClass = feature.get('class') || 'other';
                const subClass = feature.get('subclass') || '';
                const access = feature.get('access') || '';

                // Check if this is a shop-related POI that should only appear at high zoom
                const isShopPoi = [
                    'shop', 'department_store', 'mall', 'kiosk', 'marketplace',
                    'clothes', 'fashion', 'shoes', 'leather', 'jewelry', 'watches',
                    'cosmetics', 'perfumery', 'chemist', 'hairdresser', 'beauty',
                    'nails', 'tattoo', 'massage', 'medical_supply', 'hearing_aids',
                    'optician', 'camera', 'doityourself', 'hardware', 'garden_centre',
                    'garden', 'electrical', 'electronics', 'computer', 'mobile_phone',
                    'hifi', 'video', 'sports', 'outdoor', 'hunting', 'fishing',
                    'houseware', 'interior_decoration', 'kitchen', 'bed', 'furniture',
                    'lighting', 'books', 'newsagent', 'stationery', 'gift', 'ticket',
                    'music', 'video_games', 'toys', 'baby_goods', 'alcohol', 'wine',
                    'beverages', 'butcher', 'bakery', 'deli', 'dairy', 'seafood',
                    'cheese', 'health_food', 'tea', 'coffee', 'organic', 'dry_cleaning',
                    'tailor', 'sewing', 'charity', 'antiques', 'art', 'craft', 'collector',
                    'musical_instrument', 'pet', 'car', 'car_repair', 'car_parts',
                    'motorcycle', 'bicycle', 'boat', 'truck', 'motorcycle_repair',
                    'bicycle_repair', 'insurance', 'travel_agency', 'estate_agent',
                    'factory', 'locksmith', 'funeral_directors', 'religion', 'lottery',
                    'supermarket', 'convenience', 'watches'
                ].includes(poiClass) || [
                    'biycle_parking', 'motorcycle_parking', 'post_box' // Fixed typo - removed incorrect bicycle_parking
                ].includes(subClass);

                // Shops and retail only appear at zoom 17+
                if (isShopPoi && zoom < 17) {
                    return []; // Hide shops at lower zoom levels
                }

                // Skip private POI facilities - don't show icons for private toilets/pools/etc (except swimming pools which remain blue water)
                if (access === 'private' || access === 'customers' || access === 'permissive') {
                    // EXCEPTION: Keep private swimming pools visible as blue water without POI markers
                    if (!(poiClass === 'swimming_pool' || subClass === 'swimming_pool' || feature.get('leisure') === 'swimming_pool')) {
                        return []; // Hide other private POIs but keep private pools as visual water
                    }
                }

                // HIDE ALL SWIMMING POOL POI ICONS - public AND private - they appear only as blue water
                if (poiClass === 'swimming_pool' ||
                    subClass === 'swimming_pool' ||
                    feature.get('leisure') === 'swimming_pool' ||
                    (poiClass === 'water' && subClass === 'swimming_pool')) {
                    return []; // Hide ALL swimming pool POI markers - just blue water coloring
                }

                // Special handling for parking: show facilities with small icons/text
                if (poiClass === 'parking' || subClass === 'parking') {
                    const rank = feature.get('rank') || 100;
                    const hasSpecificName = name && name.toLowerCase() !== 'parking' && !name.toLowerCase().includes('street');

                    // For legitimate parking facilities (with names) - just show text labels
                    if (hasSpecificName) {
                        if (zoom >= 15 && name) {
                            return [
                                new ol.style.Style({
                                    text: new ol.style.Text({
                                        text: name,
                                        font: `400 11px "Noto Sans", Arial, sans-serif`,
                                        fill: new ol.style.Fill({ color: '#2c3e50' }),
                                        stroke: new ol.style.Stroke({
                                            color: '#ffffff',
                                            width: 2
                                        }),
                                        textBaseline: 'middle',
                                        textAlign: 'center'
                                    }),
                                    zIndex: 151
                                })
                            ];
                        }
                        return []; // Hide unnamed or low-zoom parking
                    }

                    // For generic street parking - show minimal text-only at very high zoom
                    if (zoom >= 17) {
                        return [
                            new ol.style.Style({
                                text: new ol.style.Text({
                                    text: name || 'P',
                                    font: `400 8px "Noto Sans", Arial, sans-serif`,
                                    fill: new ol.style.Fill({ color: '#888' }),
                                    stroke: new ol.style.Stroke({
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        width: 1
                                    }),
                                    textBaseline: 'middle',
                                    textAlign: 'center'
                                }),
                                zIndex: 151
                            })
                        ];
                    }

                    return []; // Hide most generic parking at lower zoom
                }
                const iconMapping = {
                    // Transportation
                    'airport': 'icon-airport',
                    'railway': 'icon-rail',
                    'railway_station': 'icon-rail',
                    'station': 'icon-rail', // railway station subclass
                    'bus_station': 'icon-bus',
                    'fuel': 'icon-fuel',
                    'parking': 'icon-parking',

                    // Financial
                    'bank': 'icon-bank',
                    'atm': 'icon-atm',

                    // Food & Drink - FIXED
                    'restaurant': 'icon-restaurant',
                    'cafe': 'icon-cafe',
                    'bar': 'icon-bar',
                    'fast_food': 'icon-fast_food',
                    'supermarket': 'icon-shop',
                    'convenience': 'icon-shop',

                    // Medical
                    'hospital': 'icon-hospital',
                    'pharmacy': 'icon-pharmacy',
                    'clinic': 'icon-hospital',
                    'dentist': 'icon-hospital',

                    // Education
                    'school': 'icon-school',
                    'library': 'icon-library',
                    'university': 'icon-school',
                    'college': 'icon-school',

                    // Lodging & Tourism
                    'hotel': 'icon-shelter',
                    'motel': 'icon-shelter',
                    'hostel': 'icon-shelter',
                    'guesthouse': 'icon-shelter',

                    // Retail & Shopping
                    'shop': 'icon-shop',
                    'department_store': 'icon-department_store',
                    'mall': 'icon-mall',
                    'kiosk': 'icon-kiosk',
                    'marketplace': 'icon-marketplace',
                    'clothes': 'icon-clothes',
                    'fashion': 'icon-clothes',
                    'shoes': 'icon-shoes',
                    'leather': 'icon-leather',
                    'jewelry': 'icon-jewelry',
                    'watches': 'icon-watches',
                    'cosmetics': 'icon-cosmetics',
                    'perfumery': 'icon-perfumery',
                    'chemist': 'icon-chemist', // cosmetics shop
                    'hairdresser': 'icon-hairdresser',
                    'beauty': 'icon-beauty', // beauty salon
                    'nails': 'icon-nails',  // nail salon
                    'tattoo': 'icon-tattoo', // tattoo studio
                    'massage': 'icon-massage', // massage parlor
                    'medical_supply': 'icon-pharmacy',
                    'hearing_aids': 'icon-hearing_aids',
                    'optician': 'icon-optician', // optometrist/optics
                    'camera': 'icon-camera', // photo/camera shop
                    'doityourself': 'icon-doityourself',
                    'hardware': 'icon-hardware',
                    'garden_centre': 'icon-garden_centre',
                    'garden': 'icon-garden',
                    'electrical': 'icon-electrical',
                    'electronics': 'icon-electronics',
                    'computer': 'icon-computer',
                    'mobile_phone': 'icon-mobile_phone',
                    'hifi': 'icon-hifi',
                    'video': 'icon-video',
                    'sports': 'icon-sports', // sporting goods
                    'outdoor': 'icon-outdoor',
                    'hunting': 'icon-hunting',
                    'fishing': 'icon-fishing',
                    'houseware': 'icon-houseware',
                    'interior_decoration': 'icon-interior_decoration',
                    'kitchen': 'icon-kitchen',
                    'bed': 'icon-shelter', // furniture
                    'furniture': 'icon-furniture',
                    'lighting': 'icon-lighting',
                    'books': 'icon-library',
                    'newsagent': 'icon-newsagent',
                    'stationery': 'icon-stationery',
                    'gift': 'icon-gift',
                    'ticket': 'icon-ticket',
                    'music': 'icon-music',
                    'video_games': 'icon-video_games',
                    'toys': 'icon-toys',
                    'baby_goods': 'icon-baby_goods',
                    'alcohol': 'icon-alcohol',
                    'wine': 'icon-wine',
                    'beverages': 'icon-beverages',
                    'butcher': 'icon-butcher',
                    'bakery': 'icon-bakery',
                    'deli': 'icon-deli',
                    'dairy': 'icon-dairy',
                    'seafood': 'icon-seafood',
                    'cheese': 'icon-cheese',
                    'health_food': 'icon-health_food',
                    'tea': 'icon-tea',
                    'coffee': 'icon-coffee',
                    'organic': 'icon-organic',
                    'dry_cleaning': 'icon-dry_cleaning',
                    'tailor': 'icon-tailor',
                    'sewing': 'icon-sewing',
                    'charity': 'icon-charity',
                    'antiques': 'icon-antiques',
                    'art': 'icon-art',
                    'craft': 'icon-craft',
                    'collector': 'icon-collector',
                    'musical_instrument': 'icon-musical_instrument',
                    'pet': 'icon-pet',
                    'car': 'icon-car',
                    'car_repair': 'icon-car_repair',
                    'car_parts': 'icon-car_parts',
                    'motorcycle': 'icon-motorcycle',
                    'bicycle': 'icon-bicycle',
                    'boat': 'icon-boat',
                    'truck': 'icon-truck',
                    'motorcycle_repair': 'icon-motorbike',
                    'bicycle_repair': 'icon-bicycle_repair',
                    'insurance': 'icon-insurance',
                    'travel_agency': 'icon-travel_agency',
                    'estate_agent': 'icon-estate_agent',
                    'factory': 'icon-factory',
                    'locksmith': 'icon-locksmith',
                    'funeral_directors': 'icon-funeral_directors',
                    'religion': 'icon-religion', // religious supplies
                    'lottery': 'icon-lottery',

                    // Entertainment & Sports
                    'cinema': 'icon-cinema',
                    'theatre': 'icon-cinema',
                    'stadium': 'icon-stadium',
                    'sports_centre': 'icon-sports',
                    'pitch': 'icon-pitch',
                    'playground': 'icon-playground',
                    'swimming_pool': 'icon-swimming',
                    'dance': 'icon-sports',
                    'fitness_centre': 'icon-sports',
                    'golf_course': 'icon-sports',
                    'horse_riding': 'icon-sports',
                    'skateboard': 'icon-sports',
                    'tennis': 'icon-sports',
                    'basketball': 'icon-sports',
                    'football': 'icon-sports',
                    'soccer': 'icon-sports',

                    // Culture & Places
                    'museum': 'icon-historic',
                    'artwork': 'icon-historic',
                    'attraction': 'icon-historic',
                    'castle': 'icon-historic',
                    'ruins': 'icon-historic',
                    'monument': 'icon-historic',
                    'memorial': 'icon-historic',
                    'statue': 'icon-historic',
                    'fort': 'icon-historic',
                    'lighthouse': 'icon-historic',
                    'windmill': 'icon-historic',
                    'watermill': 'icon-historic',
                    'tower': 'icon-historic',
                    'bridge': 'icon-historic',

                    // Government & Services
                    'post_office': 'icon-post',
                    'post_box': 'icon-post', // postal/mail boxes
                    'police': 'icon-police',
                    'fire_station': 'icon-fire_station',
                    'town_hall': 'icon-town_hall',
                    'court_house': 'icon-town_hall',
                    'embassy': 'icon-town_hall',
                    'government': 'icon-town_hall',

                    // Transportation Services
                    'taxi_stand': 'icon-taxi_stand',
                    'car_rental': 'icon-car_rental',
                    'bicycle_rental': 'icon-bicycle_rental',
                    'motorcycle_rental': 'icon-motorbike',

                    // Motorcycle/Bicycle Parking
                    'motorcycle_parking': 'icon-motorbike',
                    'bicycle_parking': 'icon-bicycle',

                    // Public Facilities
                    'toilets': 'icon-toilet',
                    'telephone': 'icon-shop', // public phone
                    'water_point': 'icon-shop' // drinking water
                };

                // Get icon name from mapping - NO FALLBACK ICONS
                let iconName = iconMapping[poiClass] || iconMapping[subClass];

                // If no exact match, try partial matching
                if (!iconName) {
                    for (const [key, value] of Object.entries(iconMapping)) {
                        if (poiClass && poiClass.includes(key)) {
                            iconName = value;
                            break;
                        }
                        if (subClass && subClass.includes(key)) {
                            iconName = value;
                            break;
                        }
                    }
                }

                // No default fallback - unmapped POIs show no icon

                // Emoji mapping for shop subclasses
                const emojiMapping = {
                    'clothes': '👕',
                    'fashion': '👗',
                    'shoes': '👟',
                    'leather': '👜',
                    'jewelry': '💍',
                    'watches': '⌚',
                    'cosmetics': '💄',
                    'perfumery': '🌸',
                    'chemist': '🧴',
                    'hairdresser': '✂️',
                    'beauty': '💅',
                    'nails': '💅',
                    'tattoo': '🎨',
                    'massage': '🧴',
                    'optician': '👓',
                    'camera': '📷',
                    'doityourself': '🔧',
                    'hardware': '🔨',
                    'electrical': '⚡',
                    'electronics': '📱',
                    'computer': '💻',
                    'mobile_phone': '📱',
                    'hifi': '🎵',
                    'video': '🎥',
                    'sports': '⚽',
                    'outdoor': '🏔️',
                    'hunting': '🎯',
                    'fishing': '🎣',
                    'books': '📚',
                    'newsagent': '📰',
                    'stationery': '📝',
                    'gift': '🎁',
                    'music': '🎵',
                    'video_games': '🎮',
                    'toys': '🧸',
                    'baby_goods': '👶',
                    'pharmacy': '💊',
                    'medical_supply': '🏥',
                    'hearing_aids': '👂',
                    'garden_centre': '🌱',
                    'garden': '🌻',
                    'interior_decoration': '🛋️',
                    'houseware': '🏠',
                    'kitchen': '🍽️',
                    'furniture': '🪑',
                    'lighting': '💡',
                    'bed': '🛏️',
                    'alcohol': '🍾',
                    'wine': '🍷',
                    'beverages': '🥤',
                    'butcher': '🥩',
                    'bakery': '🍞',
                    'deli': '🧀',
                    'dairy': '🥛',
                    'seafood': '🐟',
                    'cheese': '🧀',
                    'health_food': '🥦',
                    'tea': '☕',
                    'coffee': '☕',
                    'organic': '🌱',
                    'dry_cleaning': '🧹',
                    'tailor': '🧵',
                    'sewing': '🪡',
                    'charity': '🤝',
                    'antiques': '🏺',
                    'art': '🎨',
                    'craft': '🎨',
                    'collector': '🪙',
                    'musical_instrument': '🎹',
                    'pet': '🐕',
                    'car': '🚗',
                    'car_repair': '🔧',
                    'car_parts': '🔩',
                    'motorcycle': '🏍️',
                    'bicycle': '🚲',
                    'boat': '⛵',
                    'truck': '🚛',
                    'motorcycle_repair': '🛵',
                    'bicycle_repair': '🔧',
                    'insurance': '📋',
                    'travel_agency': '✈️',
                    'estate_agent': '🏠',
                    'factory': '🏭',
                    'locksmith': '🔐',
                    'funeral_directors': '⚰️',
                    'religion': '🕊️',
                    'lottery': '🎰'
                };

                const styles = [];
                const finalIconSize = Math.min(0.6, 0.3 + (zoom - 14) * 0.05);
                // All shops have normal text size (clothes and interior_decoration were previously reduced, now same as all others)
                const textSize = Math.min(14, 10 + (zoom - 14) * 0.5); // normal size for all shops and POIs

                // Use sprites for ALL POIs - no emoji fallbacks
                if (spriteData && spriteData[iconName]) {
                    styles.push(new ol.style.Style({
                        image: new ol.style.Icon({
                            src: 'src/assets/sprites/basics/sprites.png',
                            size: [32, 32],
                            offset: getIconOffset(iconName),
                            scale: finalIconSize
                            // Removed color property to eliminate blue halo
                        }),
                        zIndex: 150 // Higher priority than emoji
                    }));
                }

                // Add label with emoji prefix for shops, amenities, and offices if name exists and zoomed in enough
                if (name && zoom >= 15) {
                    // Add emoji prefix for shops, amenities, and offices based on subclass
                    const emoji = (poiClass === 'shop' || poiClass === 'amenity' || poiClass === 'office') && emojiMapping[subClass] ? emojiMapping[subClass] + ' ' : '';

                    if (emoji) {
                        // Single text element with emoji + name for contiguous display
                        const displayText = emoji + name; // emoji directly followed by shop name

                        // At zoom 19, use zoom 20's text size (same as zoom 20)
                        let finalTextSize = textSize * 0.75; // 25% smaller for compact display
                        if (zoom >= 19) {
                            // Calculate what textSize would be at zoom 20 and use that
                            const zoom20TextSize = Math.min(14, 10 + (20 - 14) * 0.5); // Same formula but for zoom 20
                            finalTextSize = zoom20TextSize; // Use zoom 20's full size at zoom 19
                        }

                        styles.push(new ol.style.Style({
                            text: new ol.style.Text({
                                text: displayText, // contiguous emoji + text flow
                                font: `500 ${finalTextSize}px "Noto Sans", Arial, sans-serif`,
                                fill: new ol.style.Fill({ color: '#333' }),
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    width: 2
                                }),
                                offsetY: 20,
                                textBaseline: 'top',
                                textAlign: 'center',
                                overflow: true
                            }),
                            zIndex: 151
                        }));
                    } else {
                        // Normal non-shop POI - restaurants get same text size as shops
                        const finalTextSize = poiClass === 'restaurant' ? textSize * 0.75 : textSize;
                        styles.push(new ol.style.Style({
                            text: new ol.style.Text({
                                text: name,
                                font: `500 ${finalTextSize}px "Noto Sans", Arial, sans-serif`,
                                fill: new ol.style.Fill({ color: '#333' }),
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    width: 2
                                }),
                                offsetY: 20,
                                textBaseline: 'top',
                                textAlign: 'center',
                                overflow: true
                            }),
                            zIndex: 151
                        }));
                    }
                }

                return styles;
            }
        },

        // Housenumber labels - NUMBERS ONLY (not full addresses)
        'housenumber-label': {
            sourceLayer: 'housenumber',
            minZoom: 17,
            filter: (feature) => {
                // Only show housenumbers that have house number property
                return feature.get('housenumber') || feature.get('addr:housenumber');
            },
            style: (feature, zoom) => {
                const housenumber = feature.get('housenumber') || feature.get('addr:housenumber');
                const textColor = 'hsl(0, 0%, 45%)'; // Medium gray for housenumbers

                // Simple number display, no street name
                return [
                    new ol.style.Style({
                        text: new ol.style.Text({
                            text: housenumber,
                            font: '400 10px "Noto Sans", Arial, sans-serif',
                            fill: new ol.style.Fill({ color: textColor }),
                            stroke: new ol.style.Stroke({
                                color: 'hsl(0, 0%, 100%)',
                                width: 1.5
                            }),
                            textBaseline: 'bottom',
                            textAlign: 'center',
                            overflow: true
                        }),
                        zIndex: 101 // Above place labels
                    })
                ];
            }
        },

        // Administrative boundaries - PURPLE DASHED LINES
        'admin_sub': {
            sourceLayer: 'boundary',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                const adminLevel = feature.get('admin_level');
                return geomType === 'LineString' &&
                       ['4', '6', '8', 4, 6, 8].includes(adminLevel);
            },
            style: (feature, zoom) => {
                const adminLevel = Number(feature.get('admin_level')) || 0;
                let width;

                // Width varies by admin_level: higher levels are thinner
                switch (adminLevel) {
                    case 4:
                        width = Math.max(1, 2 - (zoom - 10) * 0.1); // ~2px at close zoom
                        break;
                    case 6:
                        width = Math.max(0.8, 1.5 - (zoom - 10) * 0.08); // ~1.5px
                        break;
                    case 8:
                        width = Math.max(0.6, 1 - (zoom - 12) * 0.05); // ~1px
                        break;
                    default:
                        width = 1;
                }

                return [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'hsl(280, 60%, 60%)', // PURPLE color
                            width: width,
                            lineCap: 'round',
                            lineJoin: 'round',
                            lineDash: [width * 4, width * 2] // DISCONTINUOUS DASHED
                        }),
                        zIndex: 5
                    })
                ];
            }
        },

        // Country boundaries (ALL - purple thinner and discontinuous)
        'admin_country': {
            sourceLayer: 'boundary',
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                const adminLevel = feature.get('admin_level');
                return geomType === 'LineString' &&
                       ['2', 2].includes(adminLevel);
            },
            style: (feature, zoom) => {
                // THINNER than regional boundaries
                const width = Math.max(0.8, 1.5 - (zoom - 8) * 0.1); // Thin and consistent
                return [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'hsl(280, 60%, 60%)', // SAME PURPLE as regional borders
                            width: width,
                            lineCap: 'round',
                            lineJoin: 'round',
                            lineDash: [width * 6, width * 3] // LONGER GAPS for country borders
                        }),
                        zIndex: 6
                    })
                ];
            }
        },

        // Administrative boundary labels - names along boundaries (ALL LEVELS)
        'admin-boundary-label': {
            sourceLayer: 'boundary',
            minZoom: 8, // Start showing earlier for better visibility
            filter: (feature) => {
                const geomType = feature.getGeometry().getType();
                const adminLevelStr = String(feature.get('admin_level'));
                const name = feature.get('name') || feature.get('name_en') || feature.get('name:latin');
                return geomType === 'LineString' &&
                       ['2', '4', '6', '8'].includes(adminLevelStr) &&
                       name; // Only show labels if name exists
            },
            style: (feature, zoom) => {
                const name = feature.get('name') || feature.get('name_en') || feature.get('name:latin');
                const adminLevel = Number(feature.get('admin_level')) || 0;

                // Label styling based on admin level - HIGHLY VISIBLE LIKE ROAD LABELS
                let textSize = 14; // Larger default
                let textColor = 'hsl(270, 50%, 30%)'; // Darker for visibility
                let fontWeight = 700;
                let whiteOutline = 3; // Thicker outline
                const zIndex = 125; // Higher than regular features but below road labels
                let repeatDistance = 400; // Spacing like roads

                // Progressive styling by admin level importance
                switch (adminLevel) {
                    case 2: // Country LEVEL - MOST PROMINENT
                        textSize = Math.max(16, 14 + (zoom - 8) * 0.5);
                        textColor = 'hsl(270, 60%, 20%)'; // Very dark for countries
                        fontWeight = 900; // Extra bold
                        whiteOutline = 4;
                        repeatDistance = 600; // Countries need more spacing
                        break;

                    case 4: // Regional/State LEVEL
                        textSize = Math.max(14, 12 + (zoom - 8) * 0.4);
                        textColor = 'hsl(270, 55%, 25%)'; // Dark for states/regions
                        fontWeight = 800;
                        whiteOutline = 3;
                        repeatDistance = 500;
                        break;

                    case 6: // District/County LEVEL
                        textSize = Math.max(13, 11 + (zoom - 10) * 0.3);
                        textColor = 'hsl(270, 50%, 30%)'; // Medium darker
                        fontWeight = 700;
                        whiteOutline = 2.5;
                        repeatDistance = 400;
                        break;

                    case 8: // Municipal/Local LEVEL
                        textSize = Math.max(12, 10 + (zoom - 12) * 0.2);
                        textColor = 'hsl(270, 45%, 35%)'; // Lighter local
                        fontWeight = 600;
                        whiteOutline = 2;
                        repeatDistance = 350;
                        break;
                }

                // Final safety check for name
                if (!name) return [];

                return [
                    new ol.style.Style({
                        text: new ol.style.Text({
                            text: name, // BACK TO NORMAL CASE - easier to read than uppercase
                            font: `${fontWeight} ${textSize}px "Noto Sans", Arial, sans-serif`,
                            fill: new ol.style.Fill({ color: textColor }),
                            stroke: new ol.style.Stroke({
                                color: 'rgba(255, 255, 255, 0.95)', // MORE OPAQUE white outline
                                width: whiteOutline
                            }),
                            textBaseline: 'middle',
                            textAlign: 'center',
                            placement: 'line', // SAME as road labels
                            overflow: true, // SAME as road labels
                            offsetY: 0, // CENTERED - more visible than above
                            repeat: repeatDistance // FIXED spacing like roads
                        }),
                        zIndex: zIndex
                    })
                ];
            }
        },

        // Place labels
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
                        textSize = 14;
                        textColor = 'hsl(0, 0%, 0%)';
                        textHalo = new ol.style.Stroke({
                            color: 'hsla(0, 0%, 100%, 0.75)',
                            width: 2
                        });
                        textFont = 'bold ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                        break;
                    case 'town':
                        if (zoom < 8) return [];
                        textSize = 12;
                        textColor = 'hsl(0, 0%, 25%)';
                        textHalo = new ol.style.Stroke({
                            color: 'hsl(0, 0%, 100%)',
                            width: 2
                        });
                        textFont = 'normal ' + textSize + 'px "Noto Sans", Arial, sans-serif';
                        break;
                    default:
                        if (zoom < 12) return [];
                        textSize = 11;
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

    // Main style function for Maptiler Basic
    function maptilerBasicStyle(feature, resolution) {
        if (!feature || !feature.getGeometry || typeof resolution !== 'number') {
            return [];
        }

        const layer = feature.get('layer') || '';
        const styles = [];
        const currentZoom = getZoom(resolution);
        const zoom = Math.floor(currentZoom);

        // Process each layer style
        for (const [id, styleDef] of Object.entries(layerStyles)) {
            // Skip if source layer doesn't match
            if (styleDef.sourceLayer && styleDef.sourceLayer !== layer) {
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


            // Get styles for this feature
            const layerStyles = styleDef.style(feature, zoom);
            if (layerStyles && layerStyles.length > 0) {
                styles.push(...layerStyles);
            }
        }

        return styles;
    }

    // Register the style function
    window.vectorTileStyles['maptiler-basic'] = maptilerBasicStyle;

    // Export for CommonJS environments
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { maptilerBasicStyle };
    }
})();
