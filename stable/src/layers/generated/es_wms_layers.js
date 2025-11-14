// OpenLayers WMS layers generated from JOSM imagery.xml
// Generated on: 2025-07-07 23:30:22 UTC
// Total layers: 15

export const ESLayers = [
    new ol.layer.Tile({
        title: 'Catastro Spain',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx',
            params: {
                'LAYERS': 'Catastro',
                'VERSION': '1.1.1',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'GRAFCAN OrtoExpress Urbana - Canary Islands',
        source: new ol.source.TileWMS({
            attributions: 'GRAFCAN OrtoExpress Urbana',
            url: 'https://idecan1.grafcan.es/ServicioWMS/OrtoUrb',
            params: {
                'LAYERS': 'OU',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'GRAFCAN OrtoExpress - Canary Islands',
        source: new ol.source.TileWMS({
            attributions: 'GRAFCAN OrtoExpress',
            url: 'https://idecan1.grafcan.es/ServicioWMS/OrtoExpress',
            params: {
                'LAYERS': 'ortoexpress',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'ICGC - Ortofoto de Catalunya',
        source: new ol.source.TileWMS({
            attributions: 'Institut Cartogràfic i Geològic de Catalunya',
            url: 'https://geoserveis.icgc.cat/servei/catalunya/mapa-base/wms',
            params: {
                'LAYERS': 'orto',
                'VERSION': '1.1.1',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'ICGC - Ortofoto de Catalunya Provisional',
        source: new ol.source.TileWMS({
            attributions: 'Institut Cartogràfic i Geològic de Catalunya',
            url: 'http://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms',
            params: {
                'LAYERS': 'ortofoto_color_provisional',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'ICGC - Topogràfic de Catalunya',
        source: new ol.source.TileWMS({
            attributions: 'Institut Cartogràfic i Geològic de Catalunya',
            url: 'https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service',
            params: {
                'LAYERS': 'topo',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'IGEAR - Ortofoto reciente',
        source: new ol.source.TileWMS({
            attributions: 'Instituto Geográfico de Aragón - Gobierno de Aragón',
            url: 'https://icearagon.aragon.es/AragonFoto',
            params: {
                'LAYERS': 'orto_reciente,spot,landsat,modis',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Cartografía Ráster del IGN',
        source: new ol.source.TileWMS({
            attributions: 'IGN raster',
            url: 'http://www.ign.es/wms-inspire/mapa-raster',
            params: {
                'LAYERS': 'mtn_rasterizado',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'ITACyL - Castilla y León',
        source: new ol.source.TileWMS({
            attributions: 'ITACyL',
            url: 'http://orto.wms.itacyl.es/WMS',
            params: {
                'LAYERS': 'Ortofoto_CyL',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'PNOA Spain',
        source: new ol.source.TileWMS({
            attributions: 'PNOA',
            url: 'http://www.ign.es/wms-inspire/pnoa-ma',
            params: {
                'LAYERS': 'OI.OrthoimageCoverage',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'SITNA Ortofoto de máxima actualidad',
        source: new ol.source.TileWMS({
            attributions: 'SITNA - Gobierno de Navarra / Nafarroako Gobernua',
            url: 'http://idena.navarra.es/ogc/ows',
            params: {
                'LAYERS': 'IDENA:ortofoto_maxima_actualidad',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Catastro Navarra',
        source: new ol.source.TileWMS({
            attributions: 'SITNA - Gobierno de Navarra / Nafarroako Gobernua',
            url: 'https://idena.navarra.es/ogc/ows',
            params: {
                'LAYERS': 'catastro',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'geoEuskadiren Ortoargazkiak',
        source: new ol.source.TileWMS({
            attributions: 'Eusko Jaurlaritza / Gobierno Vasco. geoEuskadi',
            url: 'https://www.geo.euskadi.eus/WMS_ORTOARGAZKIAK',
            params: {
                'LAYERS': 'ORTO_EGUNERATUENA_MAS_ACTUALIZADA',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'IDEIB - Ortofoto més recent de les Illes Balears',
        source: new ol.source.TileWMS({
            attributions: 'Infraestructura de Dades Espacials de les Illes Balears',
            url: 'https://ideib.caib.es/geoserveis/services/imatges/GOIB_Orto_IB/MapServer/WmsServer',
            params: {
                'LAYERS': '0',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Ayuntamiento de Madrid - Ortofoto actualizada',
        source: new ol.source.TileWMS({
            attributions: 'Ayuntamiento de Madrid',
            url: 'https://servpub.madrid.es/georaster/ORTOFOTOS/ORTOFOTO_MADRID/ows',
            params: {
                'LAYERS': 'ORTOFOTO_MADRID',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
visible: false
    })
];

