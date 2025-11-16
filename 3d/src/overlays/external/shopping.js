import { getTranslation } from '../../i18n/index.js';

export const shoppingOverlays = [
    {
        group: 'shopping',
        title: () => getTranslation('supermarkets'),
        query: '[out:json][timeout:25];(nwr["shop"="supermarket"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://commons.wikimedia.org/wiki/Category:Shopping_cart_icons#/media/File:Carrito.png',
        style: (feature) => ({
            color: '#2ECC40',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'shopping',
        title: () => getTranslation('clothing'),
        query: '[out:json][timeout:25];(nwr["shop"="clothes"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Clothes_icon.svg/32px-Clothes_icon.svg.png',
        style: (feature) => ({
            color: '#FF851B',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    },
    {
        group: 'shopping',
        title: () => getTranslation('electronics'),
        query: '[out:json][timeout:25];(nwr["shop"="electronics"]({{bbox}}););out body;>;out skel qt;',
        iconSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Electronics_icon.svg/32px-Electronics_icon.svg.png',
        style: (feature) => ({
            color: '#39CCCC',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3
        })
    }
]; 