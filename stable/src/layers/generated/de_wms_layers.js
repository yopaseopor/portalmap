// OpenLayers WMS layers generated from JOSM imagery.xml
// Generated on: 2025-07-07 23:30:22 UTC
// Total layers: 60

export const DELayers = [
    new ol.layer.Tile({
        title: 'Aktuelle Luftbilder der Landeshauptstadt München 20cm',
        source: new ol.source.TileWMS({
            attributions: 'Datenquelle: dl-de/by-2-0: Landeshauptstadt München – Kommunalreferat – GeodatenService – www.geodatenservice-muenchen.de',
            url: 'https://geoportal.muenchen.de/geoserver/gsm/luftbild/ows',
            params: {
                'LAYERS': 'luftbild',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'geoserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Baden-Würrtemberg DOP20',
        source: new ol.source.TileWMS({
            attributions: '© LGL-BW (2025) - dl-de/by-2-0 (https://www.govdata.de/dl-de/by-2-0) - Verwendung unter besonderer Erlaubnis',
            url: 'https://owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_ATKIS_DOP_20_C',
            params: {
                'LAYERS': 'IMAGES_DOP_20_RGB',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Brandenburg GeoBasis-DE/LGB / Alkis',
        source: new ol.source.TileWMS({
            attributions: 'GeoBasis-DE/LGB / Alkis, dl-de/by-2-0',
            url: 'https://isk.geobasis-bb.de/ows/alkis_wms',
            params: {
                'LAYERS': 'adv_alkis_gewaesser,adv_alkis_vegetation,adv_alkis_flurstuecke,adv_alkis_gebaeude,adv_alkis_tatsaechliche_nutzung,adv_alkis_verkehr,adv_alkis_siedlung',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Brandenburg GeoBasis-DE/LGB (latest) / DGM 1m',
        source: new ol.source.TileWMS({
            attributions: 'GeoBasis-DE/LGB / BB-BE DGM 1m, dl-de/by-2-0; Geoportal Berlin / DGM, dl-de/by-2-0',
            url: 'https://isk.geobasis-bb.de/mapproxy/dgm/service/wms',
            params: {
                'LAYERS': 'dgm',
                'VERSION': '1.3.0',
                'FORMAT': 'image%2Fpng',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Brandenburg GeoBasis-DE/LGB (latest) / DOP20c',
        source: new ol.source.TileWMS({
            attributions: 'GeoBasis-DE/LGB / BB-BE DOP20c, dl-de/by-2-0; Geoportal Berlin / DOP20, dl-de/by-2-0',
            url: 'https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms',
            params: {
                'LAYERS': 'bebb_dop20c',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Deutsche Bahn VzG lines January 2017',
        source: new ol.source.TileWMS({
            attributions: 'Data CC-BY 4.0 Deutsche Bahn AG',
            url: 'https://wms.michreichert.de/vzg-strecken-2017',
            params: {
                'LAYERS': 'vzg_strecken,station_codes,level_crossings',
                'VERSION': '1.1.1',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Deutsche Bahn VzG lines Nov 2015',
        source: new ol.source.TileWMS({
            attributions: 'Data CC-BY 4.0 Deutsche Bahn AG',
            url: 'https://wms.michreichert.de/vzg-strecken-2015',
            params: {
                'LAYERS': 'vzg_strecken,station_codes,level_crossings',
                'VERSION': '1.1.1',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Frankfurt am Main Luftbild 2016',
        source: new ol.source.TileWMS({
            attributions: 'Stadtvermessungsam Frankfurt am Main',
            url: 'https://geowebdienste.frankfurt.de/OD_Luftbilder_2016',
            params: {
                'LAYERS': 'opendata_luftbilder_2016',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Frankfurt am Main Luftbild 2017',
        source: new ol.source.TileWMS({
            attributions: 'Stadtvermessungsam Frankfurt am Main',
            url: 'https://geowebdienste.frankfurt.de/OD_Luftbilder_2017',
            params: {
                'LAYERS': 'opendata_luftbilder_2017',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Frankfurt am Main Luftbild 2018',
        source: new ol.source.TileWMS({
            attributions: 'Stadtvermessungsamt Frankfurt am Main',
            url: 'https://geowebdienste.frankfurt.de/OD_Luftbilder_2018',
            params: {
                'LAYERS': 'opendata_luftbilder_2018',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Frankfurt am Main Luftbild 2019',
        source: new ol.source.TileWMS({
            attributions: 'Stadtvermessungsamt Frankfurt am Main',
            url: 'https://geowebdienste.frankfurt.de/OD_Luftbilder_2019',
            params: {
                'LAYERS': 'opendata_luftbilder_2019',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hamburg ALKIS Basiskarte (farbig) (HH LGV ALKIS 2025)',
        source: new ol.source.TileWMS({
            attributions: 'Freie und Hansestadt Hamburg, Landesbetrieb Geoinformation und Vermessung',
            url: 'https://geodienste.hamburg.de/HH_WMS_ALKIS_Basiskarte',
            params: {
                'LAYERS': '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,27,25,23,29,30',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hamburg DK5 (HH LGV DK5 2024)',
        source: new ol.source.TileWMS({
            attributions: 'Freie und Hansestadt Hamburg, Landesbetrieb Geoinformation und Vermessung',
            url: 'https://geodienste.hamburg.de/HH_WMS_DK5',
            params: {
                'LAYERS': 'DK5',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hamburg 20cm (HH LGV DOP20 belaubt 2024)',
        source: new ol.source.TileWMS({
            attributions: 'Freie und Hansestadt Hamburg, Landesbetrieb Geoinformation und Vermessung',
            url: 'https://geodienste.hamburg.de/wms_dop_zeitreihe_belaubt',
            params: {
                'LAYERS': 'dop_zeitreihe_belaubt',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hamburg 20cm (HH LGV DOP20 unbelaubt 2025)',
        source: new ol.source.TileWMS({
            attributions: 'Freie und Hansestadt Hamburg, Landesbetrieb Geoinformation und Vermessung',
            url: 'https://geodienste.hamburg.de/wms_dop_zeitreihe_unbelaubt',
            params: {
                'LAYERS': 'dop_zeitreihe_unbelaubt',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hesse ALKIS',
        source: new ol.source.TileWMS({
            attributions: 'Geobasisdaten @ Hessisches Landesamt für Bodenmanagement und Geoinformation',
            url: 'https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-maps.ows',
            params: {
                'LAYERS': 'he_alk',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hesse DOP20',
        source: new ol.source.TileWMS({
            attributions: 'Geobasisdaten © Hessische Verwaltung für Bodenmanagement und Geoinformation: Digitale Orthophotos',
            url: 'https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows',
            params: {
                'LAYERS': 'he_dop20_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hesse DTK',
        source: new ol.source.TileWMS({
            attributions: 'Geobasisdaten @ Hessisches Landesamt für Bodenmanagement und Geoinformation',
            url: 'https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-maps.ows',
            params: {
                'LAYERS': 'he_dtk',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Hesse WebAtlas',
        source: new ol.source.TileWMS({
            attributions: 'Geobasisdaten @ Hessisches Landesamt für Bodenmanagement und Geoinformation',
            url: 'https://www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-maps.ows',
            params: {
                'LAYERS': 'he_pg',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Ludwigshafen 2019',
        source: new ol.source.TileWMS({
            attributions: '© Stadt Ludwigshafen am Rhein',
            url: 'https://geodaten.ludwigshafen.de/wms/luftbild_historisch',
            params: {
                'LAYERS': 'C7F0E141BD264811A166B9D478C0E20F',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Ludwigshafen 2022',
        source: new ol.source.TileWMS({
            attributions: '© Stadt Ludwigshafen am Rhein',
            url: 'https://geodaten.ludwigshafen.de/wms/luftbild_2022',
            params: {
                'LAYERS': '4B1281A1EBD54D74897B3DDA16F00006',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Mainz latest aerial imagery',
        source: new ol.source.TileWMS({
            attributions: 'Vermessung und Geoinformation Mainz',
            url: 'https://geodaten.mainz.de/map/service',
            params: {
                'LAYERS': 'Orthophoto',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Metropole Ruhr: Luftbilder (10 cm)',
        source: new ol.source.TileWMS({
            attributions: 'Datengrundlage: Regionalverband Ruhr',
            url: 'https://geodaten.metropoleruhr.de/dop/dop',
            params: {
                'LAYERS': 'DOP',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'NRW Liegenschaftskataster',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://www.wms.nrw.de/geobasis/wms_nw_alkis',
            params: {
                'LAYERS': 'adv_alkis_tatsaechliche_nutzung,adv_alkis_gewaesser,adv_alkis_vegetation,adv_alkis_verkehr,adv_alkis_siedlung,adv_alkis_gesetzl_festlegungen,adv_alkis_bodensch,adv_alkis_oeff_rechtl_sonst_festl,adv_alkis_weiteres,adv_alkis_bauw_einricht,adv_alkis_gebaeude,adv_alkis_flurstuecke',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'NRW Buildings',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://www.wms.nrw.de/geobasis/wms_nw_alkis',
            params: {
                'LAYERS': 'adv_alkis_gebaeude',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'NRW Buildings GST',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://www.wms.nrw.de/geobasis/wms_nw_alkis_punktgenauigkeit',
            params: {
                'LAYERS': 'nw_gst_PunktortAG',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'NRW DTM Hillshade',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://www.wms.nrw.de/geobasis/wms_nw_dgm-schummerung',
            params: {
                'LAYERS': 'nw_dgm-schummerung_pan',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'NRW iDOP',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://www.wms.nrw.de/geobasis/wms_nw_idop',
            params: {
                'LAYERS': 'nw_idop_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'NRW Orthophoto (RGB)',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://www.wms.nrw.de/geobasis/wms_nw_dop',
            params: {
                'LAYERS': 'nw_dop_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'NRW vDOP',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://www.wms.nrw.de/geobasis/wms_nw_vdop',
            params: {
                'LAYERS': 'nw_vdop_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saarland DOP20',
        source: new ol.source.TileWMS({
            attributions: '© Saarländer Landesamt für Vermessung, Geoinformation und Landentwicklung - dl-de/by-2-0 (https://www.govdata.de/dl-de/by-2-0)',
            url: 'https://geoportal.saarland.de/freewms/truedop',
            params: {
                'LAYERS': 'sl_dop20_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony historical aerial imagery 2005',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop-2005/guest',
            params: {
                'LAYERS': 'dop_2005',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony historical aerial imagery 2006-2008',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop_2006_2008/guest',
            params: {
                'LAYERS': 'dop_2006_2008_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony historical aerial imagery 2009-2011',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop_2009_2011/guest',
            params: {
                'LAYERS': 'dop_2009_2011_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony historical aerial imagery 2012-2014',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop_2012_2014/guest',
            params: {
                'LAYERS': 'dop_2012_2014_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony historical aerial imagery 2015-2017',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop_2015_2017/guest',
            params: {
                'LAYERS': 'dop_2015_2017_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony historical aerial imagery 2018-2020',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop_2018_2020/guest',
            params: {
                'LAYERS': 'dop_2018_2020_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony historical aerial imagery 2021-2022',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop_2021_2022/guest',
            params: {
                'LAYERS': 'dop_2021_2022_rgb',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony latest aerial imagery infrared',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop-cir/guest',
            params: {
                'LAYERS': 'sn_dop_020_cir',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony latest aerial imagery',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dop-rgb/guest',
            params: {
                'LAYERS': 'sn_dop_020',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony raw aerial imagery',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_rohdop-rgb/guest',
            params: {
                'LAYERS': 'sn_rohdop_020',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony WebAtlasSN',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_webatlas-sn/guest',
            params: {
                'LAYERS': 'Vegetation,Siedlung,Gewaesser,Verkehr,Administrative_Einheiten,Beschriftung',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony borders and parcels',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_flurstuecke/guest',
            params: {
                'LAYERS': 'Flurstueck,Gemarkung,Gemarkungsname',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony contour lines',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_hoehe/guest',
            params: {
                'LAYERS': 'hoehenlinien_50m,hoehenlinien_25m,hoehenlinien_20m,hoehenlinien_5m,hoehenlinien_2_5m',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony shaded ground',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_hoehe/guest',
            params: {
                'LAYERS': 'relief_standard',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Saxony topographic map',
        source: new ol.source.TileWMS({
            attributions: 'Staatsbetrieb Geobasisinformation und Vermessung Sachsen',
            url: 'https://geodienste.sachsen.de/wms_geosn_dtk-pg-color/guest',
            params: {
                'LAYERS': 'sn_dtk_pg_color',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: '© GeoBasis-DE/LVermGeo LSA, ALKIS Building Outlines',
        source: new ol.source.TileWMS({
            attributions: '© GeoBasis-DE/LVermGeo LSA',
            url: 'https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_BU_WMS',
            params: {
                'LAYERS': 'BU.Building',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: '© GeoBasis-DE/LVermGeo LSA, ALKIS Cadastre parcels',
        source: new ol.source.TileWMS({
            attributions: '© GeoBasis-DE/LVermGeo LSA',
            url: 'https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ALKIS_CP_WMS',
            params: {
                'LAYERS': 'CP.CadastralParcel',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: '© GeoBasis-DE/LVermGeo LSA, ATKIS Hydro Network',
        source: new ol.source.TileWMS({
            attributions: '© GeoBasis-DE/LVermGeo LSA',
            url: 'https://geodatenportal.sachsen-anhalt.de/ows_INSPIRE_LVermGeo_ATKIS_HY-N_WMS',
            params: {
                'LAYERS': 'HY.Network',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: '© GeoBasis-DE/LVermGeo LSA, DOP20',
        source: new ol.source.TileWMS({
            attributions: '© GeoBasis-DE/LVermGeo LSA',
            url: 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_DOP_WMS_OpenData/guest',
            params: {
                'LAYERS': 'lsa_lvermgeo_dop20_2',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: '© GeoBasis-DE/LVermGeo LSA, Digital administrative boundaries',
        source: new ol.source.TileWMS({
            attributions: '© GeoBasis-DE/LVermGeo LSA',
            url: 'https://www.geodatenportal.sachsen-anhalt.de/wss/service/ST_LVermGeo_DVG_ALKIS_WMS_OpenData/guest',
            params: {
                'LAYERS': 'flur,gema,gmdbez,gmd,land,lk',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Stuttgart Luftbild Stadtmessungsamt',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://gis5.stuttgart.de/arcgis/services/1_Base/WMS_Luftbilder_aktuell/MapServer/WmsServer',
            params: {
                'LAYERS': '0',
                'VERSION': '1.3.0',
                'FORMAT': 'image/jpeg',
                'TRANSPARENT': 'false'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Thüringen DOP20',
        source: new ol.source.TileWMS({
            attributions: '© Thüringer Landesamt für Bodenmanagement und Geoinformation - dl-de/by-2-0 (https://www.govdata.de/dl-de/by-2-0)',
            url: 'https://www.geoproxy.geoportal-th.de/geoproxy/services/DOP',
            params: {
                'LAYERS': 'th_dop',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Worms 2003',
        source: new ol.source.TileWMS({
            attributions: '© Nibelungenstadt Worms',
            url: 'https://geoportal-worms.de/ogc/wms/luftbild-2003',
            params: {
                'LAYERS': 'D763F3C28EC14D8BAB4C307D33306FAF',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Worms 2008',
        source: new ol.source.TileWMS({
            attributions: '© Nibelungenstadt Worms',
            url: 'https://geoportal-worms.de/ogc/wms/luftbild-2008',
            params: {
                'LAYERS': '9B60078F347C447FAF4D224FEA0028D9',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Worms 2012',
        source: new ol.source.TileWMS({
            attributions: '© Nibelungenstadt Worms',
            url: 'https://geoportal-worms.de/ogc/wms/luftbild-2012',
            params: {
                'LAYERS': 'A14D534CD14849F9972FB3BF26185152',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Worms 2016',
        source: new ol.source.TileWMS({
            attributions: '© Nibelungenstadt Worms',
            url: 'https://geoportal-worms.de/ogc/wms/luftbild2016',
            params: {
                'LAYERS': 'FFF9DFB4F6814391AB0B4BC96B3B70B2',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Worms 2020',
        source: new ol.source.TileWMS({
            attributions: '© Nibelungenstadt Worms',
            url: 'https://geoportal-worms.de/ogc/wms/luftbild2020',
            params: {
                'LAYERS': 'E1C1EF1295564C3E8B3504D516F081E9',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'Aachen Liegenschaftskataster',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://geodienste.staedteregion-aachen.de/cgi-bin/qgis_mapserv.fcgi',
            params: {
                'LAYERS': 'alkis_lk_inkas',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
        visible: false
    }),
    new ol.layer.Tile({
        title: 'ALKIS Kreis Viersen',
        source: new ol.source.TileWMS({
            attributions: '',
            url: 'https://gdi-niederrhein-geodienste.de/flurkarte_verb_sammeldienst/service',
            params: {
                'LAYERS': 'FlurkarteNW_Viersen',
                'VERSION': '1.3.0',
                'FORMAT': 'image/png',
                'TRANSPARENT': 'true'
            },
            serverType: 'mapserver'
        }),
visible: false
    })
];

