import { getTranslation } from '../../i18n/index.js';

export const educationOverlays = [
    {
        group: 'education',
        title: () => getTranslation('schools'),
        query: '[out:json][timeout:25];(nwr["amenity"="school"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/School_building_icon.svg/32px-School_building_icon.svg.png',
        style: (feature) => ({
            color: '#3D9970',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'education',
        title: () => getTranslation('universities'),
        query: '[out:json][timeout:25];(nwr["amenity"="university"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/University_icon.svg/32px-University_icon.svg.png',
        style: (feature) => ({
            color: '#2ECC40',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'education',
        title: () => getTranslation('libraries'),
        query: '[out:json][timeout:25];(nwr["amenity"="library"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Library_icon.svg/32px-Library_icon.svg.png',
        style: (feature) => ({
            color: '#01FF70',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    }
]; 