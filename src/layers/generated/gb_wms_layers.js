// OpenLayers WMS layers generated from JOSM imagery.xml
// Generated on: 2025-07-07 23:30:22 UTC
// Total layers: 2

export const GBLayers = [
    new ol.layer.Tile({
        title: 'EA LiDAR Digital Surface Model 1m (2022)',
        source: new ol.source.TileWMS({
            attributions: 'Environment Agency',
            url: 'https://environment.data.gov.uk/geoservices/datasets/9ba4d5ac-d596-445a-9056-dae3ddec0178/wms',
            params: {
                'LAYERS': 'Lidar_Composite_Hillshade_LZ_DSM_1m',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'EA LiDAR Digital Terrain Model 1m (2022)',
        source: new ol.source.TileWMS({
            attributions: 'Environment Agency',
            url: 'https://environment.data.gov.uk/geoservices/datasets/13787b9a-26a4-4775-8523-806d13af58fc/wms',
            params: {
                'LAYERS': 'Lidar_Composite_Hillshade_DTM_1m',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
visible: false
    })
];

