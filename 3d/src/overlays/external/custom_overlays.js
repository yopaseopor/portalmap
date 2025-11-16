import { getTranslation } from '../../i18n/index.js';

export const customOverlays = [
    {
        group: 'custom',
        title: () => getTranslation('bike_parking'),
        query: `
            [out:json][timeout:25];
            (
              node["amenity"="bicycle_parking"]({{bbox}});
              way["amenity"="bicycle_parking"]({{bbox}});
              relation["amenity"="bicycle_parking"]({{bbox}});
            );
            out body;
            >;
            out skel qt;
        `,
        iconSrc: './icons/bicycle_parking.svg',
        style: (feature) => ({
            color: '#01FF70',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'custom',
        title: () => getTranslation('drinking_water'),
        query: `
            [out:json][timeout:25];
            (
              node["amenity"="drinking_water"]({{bbox}});
              way["amenity"="drinking_water"]({{bbox}});
              relation["amenity"="drinking_water"]({{bbox}});
            );
            out body;
            >;
            out skel qt;
        `,
        iconSrc: './icons/drinking_water.svg',
        style: (feature) => ({
            color: '#7FDBFF',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    }
]; 