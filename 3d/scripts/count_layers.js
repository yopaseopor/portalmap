const fs = require('fs');
const path = require('path');

const layersDir = path.join(__dirname, 'src', 'layers', 'generated');

let totalWmsLayers = 0;
let totalTmsLayers = 0;

// Count WMS layers
const wmsFiles = fs.readdirSync(layersDir)
    .filter(file => file.endsWith('_wms_layers.js') && !file.startsWith('all'));

wmsFiles.forEach(file => {
    const content = fs.readFileSync(path.join(layersDir, file), 'utf8');
    const layerCount = (content.match(/new ol\.layer\.Tile\(/g) || []).length;
    totalWmsLayers += layerCount;
});

// Count TMS layers
const tmsFiles = fs.readdirSync(layersDir)
    .filter(file => file.startsWith('tms_layers_') && !file.startsWith('all'));

tmsFiles.forEach(file => {
    const content = fs.readFileSync(path.join(layersDir, file), 'utf8');
    const layerCount = (content.match(/new ol\.layer\.Tile\(/g) || []).length;
    totalTmsLayers += layerCount;
});

console.log('Total WMS layers:', totalWmsLayers);
console.log('Total TMS layers:', totalTmsLayers);
console.log('Total layers:', totalWmsLayers + totalTmsLayers);
