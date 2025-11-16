import { getTranslation } from '../../i18n/index.js';

export const transportOverlays = [
    {
        group: 'transport',
        title: () => getTranslation('bus_stops'),
        query: '[out:json][timeout:25];(nwr["highway"="bus_stop"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bus-stop.svg/32px-Bus-stop.svg.png',
        style: (feature) => ({
            color: '#0074D9',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'transport',
        title: () => getTranslation('subway_stations'),
        query: '[out:json][timeout:25];(nwr["railway"="station"]["station"="subway"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Metro.svg/32px-Metro.svg.png',
        style: (feature) => ({
            color: '#7FDBFF',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'transport',
        title: () => getTranslation('parking'),
        query: '[out:json][timeout:25];(nwr["amenity"="parking"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Parking_icon.svg/32px-Parking_icon.svg.png',
        style: (feature) => ({
            color: '#001f3f',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    }
]; 