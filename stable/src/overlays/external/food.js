import { getTranslation } from '../../i18n/index.js';

export const foodOverlays = [
    {
        group: 'food',
        title: () => getTranslation('restaurants'),
        query: `
            [out:json][timeout:25];
            (
              node["amenity"="restaurant"]({{bbox}});
              way["amenity"="restaurant"]({{bbox}});
              relation["amenity"="restaurant"]({{bbox}});
            );
            out body;
            >;
            out skel qt;
        `,
        iconSrc: './icons/restaurant.svg',
        style: (feature) => ({
            color: '#FF4136',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'food',
        title: () => getTranslation('cafes'),
        query: `
            [out:json][timeout:25];
            (
              node["amenity"="cafe"]({{bbox}});
              way["amenity"="cafe"]({{bbox}});
              relation["amenity"="cafe"]({{bbox}});
            );
            out body;
            >;
            out skel qt;
        `,
        iconSrc: './icons/cafe.svg',
        style: (feature) => ({
            color: '#B10DC9',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    }
]; 