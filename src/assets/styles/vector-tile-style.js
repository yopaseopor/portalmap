/**
 * Vector Tile Style for OpenLayers
 * Compatible with OpenLayers 7.5.2
 */

(function() {
    'use strict';

    // Basic vector tile style
    window.vectorTileStyle = function() {
        return [
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(200, 200, 200, 0.2)'
                })
            })
        ];
    };

    // Alternative style function for vector tiles
    window.getVectorTileStyle = function(feature, resolution) {
        var type = feature.getGeometry().getType();
        var styles = [
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(200, 200, 200, 0.2)'
                })
            })
        ];
        return styles;
    };
})();
