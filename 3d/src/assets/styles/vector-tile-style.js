/**
 * Vector Tile Style for MapTiler
 */

(function() {
    'use strict';

    // MapTiler vector tile style
    window.vectorTileStyle = {
        "version": 8,
        "sources": {
            "maptiler": {
                "type": "vector",
                "url": "https://api.maptiler.com/tiles/v3-openmaptiles/tiles.json?key=YOUR_API_KEY"
            }
        },
        "layers": [
            {
                "id": "background",
                "type": "background",
                "paint": {
                    "background-color": "#f8f4f0"
                }
            }
        ]
    };

})();
