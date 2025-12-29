#!/usr/bin/env python3
"""
Process WMS layers from JOSM imagery.xml and generate OpenLayers configurations
"""

import re
import sys
import traceback
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime
from collections import defaultdict

def setup_logging():
    """Set up basic logging to console."""
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

# Output directory for generated layer files
OUTPUT_DIR = Path(__file__).parent.parent / 'src' / 'layers' / 'generated'

# Template for the layer file
LAYER_TEMPLATE = """// OpenLayers WMS layers generated from JOSM imagery.xml
// Generated on: {generation_date}
// Total layers: {layer_count}

const {country_code}Layers = [
{layers}
];

export default {country_code}Layers;
"""

# Template for individual layers
LAYER_ITEM_TEMPLATE = """    new ol.layer.Tile({{
        title: '{name}',
        source: new ol.source.TileWMS({{
            attributions: '{attribution}',
            url: '{base_url}',
            params: {{
                'LAYERS': '{layers}',
                'VERSION': '{version}',
                'FORMAT': '{format}','{transparent}'
            }},
            serverType: '{server_type}'
        }}),
        visible: false
    }}),"""

class WmsLayerProcessor:
    """Process WMS layers from JOSM imagery.xml."""
    
    def __init__(self, xml_file):
        self.xml_file = Path(xml_file)
        self.layers = []
    
    def sanitize_text(self, text):
        """Sanitize text for use in JavaScript strings."""
        if not text:
            return ''
        return (
            str(text)
            .replace("'", "\\'")
            .replace('\n', ' ')
            .strip()
        )
    
    def parse_wms_url(self, url):
        """Parse WMS URL and extract parameters."""
        if not url:
            return {}
        
        try:
            # Clean up URL
            url = url.replace('&amp;', '&')
            
            # Extract base URL
            base_url = url.split('?')[0] if '?' in url else url
            
            # Extract parameters
            params = {}
            if '?' in url:
                query = url.split('?', 1)[1]
                for param in query.split('&'):
                    if '=' in param:
                        key, value = param.split('=', 1)
                        params[key.upper()] = value
            
            return {
                'base_url': base_url,
                'params': params
            }
        except Exception as e:
            logger.error(f"Error parsing URL '{url}': {e}")
            return {}
    
    def detect_server_type(self, url):
        """Detect WMS server type from URL."""
        url = url.lower()
        if 'geoserver' in url:
            return 'geoserver'
        elif 'mapserver' in url or 'cgi-bin' in url:
            return 'mapserver'
        return 'mapserver'  # Default to mapserver
    
    def process_entry(self, entry):
        """Process a single entry element from the XML."""
        try:
            # Define the namespace
            ns = {'ns': 'http://josm.openstreetmap.de/maps-1.0'}
            
            # Get required elements with namespace handling
            name_elem = entry.find('ns:name', namespaces=ns)
            url_elem = entry.find('ns:url', namespaces=ns)
            type_elem = entry.find('ns:type', namespaces=ns)
            
            # Debug log the found elements
            logger.debug(f"Name elem: {name_elem.text if name_elem else 'None'}")
            logger.debug(f"URL elem: {url_elem.text if url_elem else 'None'}")
            logger.debug(f"Type elem: {type_elem.text if type_elem else 'None'}")
            
            # Skip if required elements are missing
            if not all([name_elem is not None, url_elem is not None, type_elem is not None]):
                missing = []
                if name_elem is None: missing.append('name')
                if url_elem is None: missing.append('url')
                if type_elem is None: missing.append('type')
                logger.warning(f"Skipping entry due to missing elements: {', '.join(missing)}")
                return None
            
            # Only process WMS layers
            layer_type = type_elem.text.strip().lower()
            if layer_type != 'wms':
                logger.debug(f"Skipping non-WMS layer type: {layer_type}")
                return None
            
            # Get basic info
            name = self.sanitize_text(name_elem.text)
            url = url_elem.text.strip()
            logger.debug(f"Processing layer: {name}")
            logger.debug(f"URL: {url}")
            
            # Get country code (default to 'XX' if not found)
            country_elem = entry.find('ns:country-code', namespaces=ns)
            country_code = country_elem.text.strip().upper() if country_elem is not None and country_elem.text else 'XX'
            logger.debug(f"Country code: {country_code}")
            
            # Get attribution
            attribution = ''
            attribution_elem = entry.find('ns:attribution-text', namespaces=ns)
            if attribution_elem is not None and attribution_elem.text:
                attribution = self.sanitize_text(attribution_elem.text)
            logger.debug(f"Attribution: {attribution}")
            
            # Parse WMS URL
            wms_info = self.parse_wms_url(url)
            if not wms_info:
                logger.warning(f"Failed to parse WMS URL: {url}")
                return None
            
            # Get layer name from params or use a default
            params = wms_info['params']
            layer_name = params.get('LAYERS', '')
            if not layer_name:
                # Try to extract from URL path
                path_parts = wms_info['base_url'].rstrip('/').split('/')
                if path_parts:
                    layer_name = path_parts[-1]
                else:
                    layer_name = 'default'
            
            # Get format, default to png
            format_type = params.get('FORMAT', 'image/png')
            
            # Determine if layer should be transparent
            transparent = 'true' if 'png' in format_type.lower() or 'transparent' in format_type.lower() else 'false'
            
            # Get version
            version = params.get('VERSION', '1.3.0')
            
            # Get style if available
            style = params.get('STYLES', 'default')
            
            # Detect server type
            server_type = self.detect_server_type(wms_info['base_url'])
            
            logger.debug(f"Processed layer - Name: {layer_name}, Format: {format_type}, Version: {version}, Server: {server_type}")
            
            return {
                'name': name,
                'country_code': country_code,
                'base_url': wms_info['base_url'],
                'layer_name': layer_name,
                'attribution': attribution,
                'format': format_type,
                'transparent': transparent,
                'version': version,
                'style': style,
                'server_type': server_type
            }
            
        except Exception as e:
            logger.error(f"Error processing entry: {e}")
            logger.debug(traceback.format_exc())
            return None
    
    def parse_xml(self):
        """Parse the XML file and extract WMS layers."""
        logger.info(f"Parsing {self.xml_file}...")
        
        try:
            # Parse the XML file
            with open(self.xml_file, 'r', encoding='utf-8') as f:
                xml_content = f.read()
            
            # Parse the XML
            root = ET.fromstring(xml_content)
            
            # Get all entries in the file
            all_entries = root.findall('.//{http://josm.openstreetmap.de/maps-1.0}entry')
            logger.info(f"Found {len(all_entries)} total entries in the file")
            
            for i, entry in enumerate(all_entries[:5]):
                logger.info(f"\nEntry {i+1}:")
                logger.info(f"  Tag: {entry.tag}")
                logger.info(f"  Attributes: {entry.attrib}")
                logger.info("  Children:")
                for child in entry:
                    # Extract local name without namespace
                    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                    logger.info(f"    {tag}: {child.text}")
                    
                    # If this is a type element, log it specially
                    if tag == 'type':
                        logger.info(f"    ^^^ Found type: {child.text}")
                    
                    # If this is a name element, log it specially
                    if tag == 'name':
                        logger.info(f"    ^^^ Found name: {child.text}")
                    
                    # If this is a url element, log it specially
                    if tag == 'url':
                        logger.info(f"    ^^^ Found URL: {child.text}")
            
            # Find all WMS entries
            wms_entries = []
            
            for i, entry in enumerate(all_entries):
                # Log progress every 100 entries
                if i % 100 == 0 and i > 0:
                    logger.info(f"Processed {i} entries...")
                
                # Find type element
                type_elem = entry.find('{http://josm.openstreetmap.de/maps-1.0}type')
                
                # Check if this is a WMS entry
                if type_elem is not None and type_elem.text and type_elem.text.strip().lower() == 'wms':
                    name_elem = entry.find('{http://josm.openstreetmap.de/maps-1.0}name')
                    url_elem = entry.find('{http://josm.openstreetmap.de/maps-1.0}url')
                    
                    # Only add if we have all required elements
                    if name_elem is not None and url_elem is not None:
                        # Log the first few WMS entries for debugging
                        if len(wms_entries) < 3:  # Only log first 3 to avoid too much output
                            logger.info(f"\nFound WMS entry #{len(wms_entries) + 1}:")
                            logger.info(f"  Name: {name_elem.text}")
                            logger.info(f"  URL: {url_elem.text}")
                        
                        wms_entries.append(entry)
            
            logger.info(f"\nFound {len(wms_entries)} WMS entries in total")
            entries = wms_entries
            
            # Print details of the first WMS entry for debugging
            if entries:
                first_entry = entries[0]
                logger.info("\nFirst WMS entry details:")
                
                # Extract all elements we're interested in
                name = first_entry.find('{http://josm.openstreetmap.de/maps-1.0}name')
                url = first_entry.find('{http://josm.openstreetmap.de/maps-1.0}url')
                type_elem = first_entry.find('{http://josm.openstreetmap.de/maps-1.0}type')
                country_code = first_entry.find('{http://josm.openstreetmap.de/maps-1.0}country-code')
                attribution = first_entry.find('{http://josm.openstreetmap.de/maps-1.0}attribution-text')
                
                logger.info(f"Name: {name.text if name is not None else 'None'}")
                logger.info(f"URL: {url.text if url is not None else 'None'}")
                logger.info(f"Type: {type_elem.text if type_elem is not None else 'None'}")
                logger.info(f"Country Code: {country_code.text if country_code is not None else 'None'}")
                logger.info(f"Attribution: {attribution.text if attribution is not None else 'None'}")
            
            # Print details of first few entries if found
            if entries:
                logger.info("Details of first WMS entry:")
                first_entry = entries[0]
                logger.info(f"Entry tag: {first_entry.tag}")
                logger.info(f"Entry attributes: {first_entry.attrib}")
                
                # Print all direct children with their tags and text
                for child in first_entry:
                    # Remove namespace from tag for cleaner output
                    tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                    logger.info(f"  {tag}: {child.text}")
                    
                    # If this is the URL element, try to parse it
                    if tag == 'url':
                        logger.info(f"  URL element found: {child.text}")
                        wms_info = self.parse_wms_url(child.text)
                        if wms_info:
                            logger.info(f"  Parsed WMS URL: {wms_info}")
            
            # Process each WMS entry
            for entry in entries:
                layer = self.process_entry(entry)
                if layer:
                    self.layers.append(layer)
            
            logger.info(f"Successfully processed {len(self.layers)} WMS layers")
            return self.layers
            
        except Exception as e:
            logger.error(f"Error parsing XML file: {str(e)}")
            logger.error(traceback.format_exc())
            return []
        except Exception as e:
            logger.error(f"Error parsing XML: {e}")
            logger.debug(traceback.format_exc())
            return []

def generate_layer_files(layers):
    """Generate layer files organized by country code."""
    if not layers:
        logger.warning("No layers to process")
        return
        
    # Group layers by country code
    layers_by_country = defaultdict(list)
    for layer in layers:
        layers_by_country[layer['country_code']].append(layer)
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create a processor instance for helper methods
    processor = WmsLayerProcessor('')
    
    # Generate a file for each country
    for country_code, country_layers in layers_by_country.items():
        if not country_layers:
            continue
        
        logger.info(f"Generating layers for country: {country_code} ({len(country_layers)} layers)")
        
        # Generate layer configurations
        layer_configs = []
        for i, layer in enumerate(country_layers, 1):
            try:
                # Format the transparent parameter
                transparent_param = f"\n                'TRANSPARENT': {layer['transparent']}"
                
                layer_config = LAYER_ITEM_TEMPLATE.format(
                    name=processor.sanitize_text(layer['name']),
                    base_url=layer['base_url'],
                    layers=layer['layer_name'],
                    attribution=layer['attribution'],
                    format=layer['format'],
                    version=layer['version'],
                    transparent=transparent_param,
                    server_type=layer['server_type']
                )
                layer_configs.append(layer_config)
                
                if i % 10 == 0 or i == len(country_layers):
                    logger.debug(f"Processed {i}/{len(country_layers)} layers for {country_code}")
                    
            except Exception as e:
                logger.error(f"Error generating config for layer {i}: {e}")
                logger.debug(traceback.format_exc())
        
        if not layer_configs:
            logger.warning(f"No valid layers for country {country_code}")
            continue
        
        # Generate file content
        content = LAYER_TEMPLATE.format(
            country_code=country_code,
            generation_date=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            layer_count=len(layer_configs),
            layers='\n'.join(layer_configs)
        )
        
        # Write to file
        filename = f"{country_code.lower()}_wms_layers.js"
        filepath = OUTPUT_DIR / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"Generated {filepath} with {len(layer_configs)} layers")

def main():
    # Path to imagery.xml
    xml_file = Path(__file__).parent.parent / 'src' / 'layers' / 'imagery.xml'
    
    if not xml_file.exists():
        logger.error(f"Error: {xml_file} not found")
        return
    
    # Process the XML file
    processor = WmsLayerProcessor(xml_file)
    layers = processor.parse_xml()
    
    if not layers:
        logger.error("No WMS layers found in the XML file")
        return
    
    # Generate the layer files
    generate_layer_files(layers)
    
    logger.info("\nProcessing complete!")

if __name__ == "__main__":
    main()
