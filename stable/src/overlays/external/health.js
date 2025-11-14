import { getTranslation } from '../../i18n/index.js';

export const healthOverlays = [
    {
        group: 'health',
        title: () => getTranslation('hospitals'),
        query: '[out:json][timeout:25];(nwr["amenity"="hospital"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Hospital_sign.svg/32px-Hospital_sign.svg.png',
        style: (feature) => ({
            color: '#FF4136',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'health',
        title: () => getTranslation('pharmacies'),
        query: '[out:json][timeout:25];(nwr["amenity"="pharmacy"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Pharmacy_green_cross.svg/32px-Pharmacy_green_cross.svg.png',
        style: (feature) => ({
            color: '#85144b',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'health',
        title: () => getTranslation('clinics'),
        query: '[out:json][timeout:25];(nwr["amenity"="clinic"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Health_care_clinic.svg/32px-Health_care_clinic.svg.png',
        style: (feature) => ({
            color: '#F012BE',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    }
]; 