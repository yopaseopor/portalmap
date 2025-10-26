#!/usr/bin/env python3
"""
Process TMS (Tile Map Service) layers from OSM imagery.xml file and generate
OpenLayers-compatible layer definitions.
"""
import os
import re
import xml.etree.ElementTree as ET
import logging
import argparse
import json
import traceback
from datetime import datetime
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('tms_processor.log')
    ]
)
logger = logging.getLogger(__name__)

class TmsLayerProcessor:
    """Process TMS layers from OSM imagery.xml file."""
    
    def __init__(self, xml_file, output_dir):
        """Initialize the processor with XML file and output directory."""
        self.xml_file = xml_file
        self.output_dir = output_dir
        self.layers = []
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
    
    def sanitize_text(self, text):
        """Sanitize text for use in JavaScript strings."""
        if not text:
            return ''
        # Escape backslashes and quotes
        text = text.replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ')
        # Remove any remaining control characters
        text = re.sub(r'[\x00-\x1F\x7F-\x9F]', ' ', text)
        return text.strip()
        
    def is_tms_url(self, url):
        """Check if a URL is a TMS endpoint by looking for TMS-specific patterns."""
        if not url:
            return False
            
        tms_indicators = [
            '{-y}',      # JOSM TMS format
            '{!y}',      # Alternative TMS format
            'y=',        # Common in TMS query parameters
            'y/0',       # Common in TMS path parameters
            'tms=',      # Explicit TMS parameter
            'tms/1.0',   # TMS version in URL
            'tms/1.0.0'  # TMS version in URL
        ]
        return any(indicator in url for indicator in tms_indicators)
        
    def sanitize_js_string(self, text):
        """Sanitize a string for use in JavaScript, handling None and special characters."""
        if text is None:
            return ''
            
        # Convert to string in case it's not
        text = str(text)
        
        # First, escape backslashes
        text = text.replace('\\', '\\\\')
        
        # Then escape other special characters
        escape_chars = {
            "'": "\\'",
            '"': '\\"',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\b': '\\b',
            '\f': '\\f',
            ':': '\\:',  # Escape colons which are causing issues
            '{': '\\{',  # Escape curly braces
            '}': '\\}',
            '[': '\\[',  # Escape square brackets
            ']': '\\]',
            '(': '\\(',  # Escape parentheses
            ')': '\\)',
            '/': '\\/'   # Escape forward slashes
        }
        
        # Replace special characters
        for char, escaped in escape_chars.items():
            text = text.replace(char, escaped)
        
        # Escape any other control characters
        result = []
        for c in text:
            if ord(c) < 32 or ord(c) > 126:
                result.append(f'\\x{ord(c):02x}')
            else:
                result.append(c)
                
        return ''.join(result)
    
    def parse_tms_url(self, url):
        """Parse TMS URL and make it compatible with OpenLayers."""
        logger.debug(f"\n{'='*50}")
        logger.debug(f"Parsing TMS URL: {url}")
        
        if not url:
            logger.debug("URL is empty")
            return None
            
        # Common TMS URL patterns and their OpenLayers equivalents
        replacements = [
            # Handle switch patterns like {switch:a,b,c} -> {a-c}
            (r'\{switch:([^}]*)\}', lambda m: f"{{{','.join(c for c in m.group(1) if c.isalnum())}}}"),
            # Handle zoom variations
            (r'\{z\+?(-?\d*)\}', r'{z\1}'),
            (r'\{zoom(\+\d+)?\}', r'{z\1}'),
            # Handle Y coordinate inversion (TMS vs XYZ)
            (r'\{-y\}', r'{-y}'),
            # Handle subdomains
            (r'\{switch:([^}]*)\}', r'\1'),
            (r'\{([a-z])\|([^}]*)\}', r'{\1}'),  # {a|b|...} -> {a}
            (r'\{([a-z])\}', r'{\1}'),  # Remove any remaining single letters in braces
        ]
        
        # Log the original URL before any replacements
        logger.debug(f"Original URL: {url}")
        
        # Apply replacements and log each step
        for pattern, repl in replacements:
            new_url = re.sub(pattern, repl, url)
            if new_url != url:
                logger.debug(f"Applied replacement: {pattern} -> {repl}")
                logger.debug(f"  Before: {url}")
                logger.debug(f"  After:  {new_url}")
                url = new_url
            
        # Check for required placeholders
        has_z = '{z}' in url or '{zoom' in url
        has_x = '{x}' in url
        has_y = '{y}' in url or '{-y}' in url or '{!y}' in url
        
        logger.debug(f"Placeholders - z: {has_z}, x: {has_x}, y: {has_y}")
            
        # Ensure the URL has the required placeholders for XYZ source
        if not (has_z and has_x and has_y):
            logger.warning(f"URL does not contain required placeholders ({{z}}/{{x}}/{{y}} or {{-y}}): {url}")
            return None
            
        # Convert TMS Y coordinate to Slippy Map (XYZ) Y coordinate if needed
        if '{-y}' in url or '{!y}' in url:
            logger.debug("Found TMS Y coordinate format, will handle in JavaScript")
            # For TMS sources, we need to use the tileUrlFunction to handle Y coordinate inversion
            # The actual replacement will be handled in the JavaScript generation
            pass
        
        logger.debug(f"Final parsed URL: {url}")
        return url
    
    def process_entry(self, entry):
        """Process a single entry element from the XML."""
        logger.debug("\n" + "="*50)
        logger.debug("Processing entry...")
        
        if not hasattr(entry, 'find'):
            logger.warning(f"Skipping invalid entry (not an Element): {entry}")
            return None
            
        try:
            # Log raw entry for debugging
            try:
                entry_str = ET.tostring(entry, encoding='unicode', method='xml')
                logger.debug(f"Raw entry XML: {entry_str[:500]}...")
            except Exception as e:
                logger.debug(f"Could not convert entry to string: {str(e)}")
            
            # Define the namespace
            ns = {'ns': 'http://josm.openstreetmap.de/maps-1.0'}
            
            # Find elements with namespace
            logger.debug("Searching for elements...")
            try:
                # Find elements with namespace
                name_elem = entry.find('ns:name', namespaces=ns)
                url_elem = entry.find('ns:url', namespaces=ns)
                type_elem = entry.find('ns:type', namespaces=ns)
                
                logger.debug(f"Found elements - name: {name_elem is not None}, url: {url_elem is not None}, type: {type_elem is not None}")
                
                # Log element details for debugging
                if name_elem is not None:
                    logger.debug(f"Name element: tag={name_elem.tag}, text={name_elem.text}")
                if url_elem is not None:
                    logger.debug(f"URL element: tag={url_elem.tag}, text={url_elem.text}")
                if type_elem is not None:
                    logger.debug(f"Type element: tag={type_elem.tag}, text={type_elem.text}")
                
            except Exception as e:
                logger.error(f"Error finding elements: {str(e)}")
                logger.debug(f"Error details: {traceback.format_exc()}")
                return None
            
            # Get element texts safely
            name_text = name_elem.text if name_elem is not None and name_elem.text is not None else None
            url_text = url_elem.text if url_elem is not None and url_elem.text is not None else None
            type_text = type_elem.text if type_elem is not None and type_elem.text is not None else None
            
            logger.debug(f"Processing entry - Name: {name_text}, Type: {type_text}, URL: {url_text}")
            
            # Check for required elements
            if not name_text or not name_text.strip():
                logger.warning("Skipping entry: Missing or empty name element")
                return None
                
            if not url_text or not url_text.strip():
                logger.warning(f"Skipping entry '{name_text}': Missing or empty URL element")
                return None
                
            if not type_text or type_text.strip().lower() != 'tms':
                logger.debug(f"Skipping non-TMS entry: {name_text}")
                return None
            
            # Process the URL
            try:
                parsed_url = self.parse_tms_url(url_text.strip())
                if not parsed_url:
                    logger.warning(f"Skipping entry '{name_text}': Invalid TMS URL format")
                    return None
                
                # Get optional elements
                country_code = 'global'
                country_elem = entry.find('ns:country-code', namespaces=ns)
                if country_elem is not None and country_elem.text and country_elem.text.strip():
                    country_code = country_elem.text.strip().lower()
                
                # Get attribution
                attribution = ''
                attribution_elem = entry.find('ns:attribution-text', namespaces=ns)
                if attribution_elem is not None and attribution_elem.text:
                    attribution = self.sanitize_text(attribution_elem.text)
                
                # Get zoom levels
                min_zoom = 0
                max_zoom = 18
                
                min_zoom_elem = entry.find('ns:min-zoom', namespaces=ns)
                if min_zoom_elem is not None and min_zoom_elem.text:
                    try:
                        min_zoom = int(min_zoom_elem.text)
                    except (ValueError, TypeError):
                        pass
                
                max_zoom_elem = entry.find('ns:max-zoom', namespaces=ns)
                if max_zoom_elem is not None and max_zoom_elem.text:
                    try:
                        max_zoom = int(max_zoom_elem.text)
                    except (ValueError, TypeError):
                        pass
                
                # Create layer info dictionary
                layer = {
                    'name': self.sanitize_text(name_text.strip()),
                    'url': parsed_url,
                    'original_url': url_text.strip(),
                    'country_code': country_code,
                    'attribution': attribution,
                    'min_zoom': min_zoom,
                    'max_zoom': max_zoom,
                    'type': 'tms'
                }
                
                logger.debug(f"Successfully processed layer: {layer['name']}")
                return layer
                
            except Exception as e:
                logger.error(f"Error processing URL for entry '{name_text}': {str(e)}")
                logger.debug(f"Error details: {traceback.format_exc()}")
                return None
                
        except Exception as e:
            logger.error(f"Unexpected error processing entry: {str(e)}")
            logger.debug(f"Error details: {traceback.format_exc()}")
            return None
    
    def generate_layer_js(self, country_code, layers):
        """Generate JavaScript code for OpenLayers layers."""
        # Sort layers by name
        layers_sorted = sorted(layers, key=lambda x: x['name'].lower())
        
        # Get current date for the header
        from datetime import datetime
        generation_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Create JavaScript code
        js_code = f"""// OpenLayers TMS/XYZ Layers for {country_code}
// Generated on: {generation_date}
// Total layers: {len(layers_sorted)}

const {country_code.upper()}_TMS_LAYERS = [
"""
        
        # Add each layer as an OpenLayers layer
        layer_js = []
        for layer in layers_sorted:
            name = layer['name'].replace('"', '\\"')
            attribution = layer.get('attribution', '').replace('"', '\\"')
            url = layer['url'].replace('"', '\\"')
            min_zoom = layer.get('min_zoom', 0)
            max_zoom = layer.get('max_zoom', 19)
            
            # Check if this is a TMS source (uses {-y} for Y coordinate)
            is_tms = self.is_tms_url(layer['url'])
            
            if is_tms:
                # For TMS sources, we need to use a custom tileUrlFunction
                # to handle the Y coordinate inversion
                layer_js.append(f"""  new ol.layer.Tile({{
        title: "{name}",
        type: 'TMS',
        source: new ol.source.XYZ({{
            url: '{url}'.replace('{-y}', '{{y}}'),
            tileUrlFunction: function(tileCoord) {{
                const z = tileCoord[0];
                const x = tileCoord[1];
                const y = tileCoord[2];
                const yTMS = (1 << z) - y - 1;  // Convert Y to TMS format
                return '{url}'.replace('{{z}}', z.toString())
                             .replace('{{x}}', x.toString())
                             .replace('{-y}', yTMS.toString());
            }},
            attributions: '{attribution}',
            maxZoom: {max_zoom},
            minZoom: {min_zoom},
            crossOrigin: 'anonymous',
            tileSize: 256,
            projection: 'EPSG:3857'
        }}),
        visible: false
    }}""")
            else:
                # For standard XYZ sources, we can use the URL directly
                layer_js.append(f"""  new ol.layer.Tile({{
        title: "{name}",
        type: 'XYZ',
        source: new ol.source.XYZ({{
            url: '{url}',
            attributions: '{attribution}',
            maxZoom: {max_zoom},
            minZoom: {min_zoom},
            crossOrigin: 'anonymous',
            tileSize: 256,
            projection: 'EPSG:3857'
        }}),
        visible: false
    }}""")
        
        js_code += ",\n".join(layer_js)
        js_code += "\n];\n"
        
        # Add to global layers array if it exists
        js_code += f"""
// Add to global layers array if it exists
if (typeof window.layers === 'undefined') {{
    window.layers = [];
}}
window.layers = window.layers.concat({country_code.upper()}_TMS_LAYERS);
"""
        
        return js_code

    def generate_all_layers_js(self, all_layers):
        """Generate a single JavaScript file with all TMS layers in OpenLayers format."""
        from datetime import datetime
        import json
        import traceback
        
        generation_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Sort layers by name
        layers_sorted = sorted(all_layers, key=lambda x: x.get('name', '').lower())
        
        js_code = f"""// OpenLayers TMS/XYZ Layers (All Countries)
// Generated on: {generation_date}
// Total layers: {len(layers_sorted)}

const ALL_TMS_LAYERS = [
"""
        
        # Add each layer as an OpenLayers layer
        layer_js = []
        processed_count = 0
        
        for layer in layers_sorted:
            try:
                # Safely get layer properties with defaults
                name = layer.get('name', 'Unnamed Layer')
                attribution = layer.get('attribution', '')
                country_code = layer.get('country_code', 'XX')
                url = layer.get('url', '').strip()
                
                if not url:
                    logger.warning(f"Skipping layer '{name}' - No URL provided")
                    continue
                    
                # Clean and validate URL
                url = url.replace('"', '').replace("'", "").strip()
                if not (url.startswith('http://') or url.startswith('https://')):
                    logger.warning(f"Skipping layer '{name}' - Invalid URL: {url}")
                    continue
                
                min_zoom = int(layer.get('min_zoom', 0))
                max_zoom = int(layer.get('max_zoom', 19))
                
                # Determine if this is a TMS source
                is_tms = self.is_tms_url(url)
                
                # Handle different URL patterns
                url = url.replace('{switch:a,b,c}', '{a}')
                
                # Create the layer configuration as a dictionary
                # Escape special characters in the name and URL to prevent string formatting issues
                safe_name = name.replace('{', '{{').replace('}', '}}')
                safe_url = url.replace('{', '{{').replace('}', '}}')
                safe_attribution = attribution.replace('{', '{{').replace('}', '}}') if attribution else ''
                
                # Create a unique ID for the layer
                if country_code not in self.country_layers:
                    self.country_layers[country_code] = []
                layer_id = f"layer_{len(self.country_layers[country_code])}"
                
                layer_config = {
                    'id': layer_id,
                    'title': f"{safe_name} ({country_code})",
                    'type': 'TMS' if is_tms else 'XYZ',
                    'source': {
                        'type': 'XYZ',
                        'url': safe_url,
                        'attributions': safe_attribution,
                        'maxZoom': max_zoom,
                        'minZoom': min_zoom,
                        'crossOrigin': 'anonymous',
                        'tileSize': 256,
                        'projection': 'EPSG:3857'
                    },
                    'visible': False
                }
                
                # Add TMS-specific configuration
                if is_tms:
                    # Create a safe URL string with proper escaping
                    safe_url = url.replace('\\', '\\\\').replace("'", "\\'")
                    
                    # Create a simpler tile URL function that handles TMS Y coordinate conversion
                    safe_url = safe_url.replace('\\', '\\\\').replace("'", "\\'")
                    # Create a simple tile URL function that handles TMS Y coordinate conversion
                    tile_url_function = """function(tileCoord) {
                        if (!tileCoord || tileCoord.length < 3) return '';
                        
                        const z = tileCoord[0];
                        const x = tileCoord[1];
                        const y = tileCoord[2];
                        
                        if (isNaN(z) || isNaN(x) || isNaN(y)) return '';
                        
                        // Calculate TMS Y coordinate (invert the Y axis)
                        const tmsY = (1 << z) - y - 1;
                        
                        // Process the URL with placeholders
                        let url = '{0}';
                        
                        // Replace placeholders
                        url = url
                            .replace(/\\\\{\\{switch:[^}]+\\\\}\\}/g, 'a')
                            .replace(/\\{\\{z\\\}/g, z)
                            .replace(/\\{\\{x\\\}/g, x)
                            .replace(/\\{\\{-y\\\}/g, tmsY)
                            .replace(/\\{\\{!y\\\}/g, tmsY)
                            .replace(/([^\\])\\{(y)\\}/g, (m, p1) => p1 + tmsY)
                            .replace(/\\{\\{zoom\\\}/g, z)
                            .replace(/\\{\\{col\\\}/g, x)
                            .replace(/\\{\\{row\\\}/g, tmsY)
                            .replace(/([?&])[a-z]=[^&]*/g, '$1')
                            .replace(/[?&]$/, '');
                            
                        return url;
                    }""".format(safe_url.replace('\\', '\\\\').replace("'", "\\'"))
                    
                    # Add the tile URL function to the source
                    layer_config['source']['tileUrlFunction'] = tile_url_function
                    
                    # For TMS, we need to ensure the URL uses the tileUrlFunction
                    # Remove the URL from the source to avoid confusion
                    layer_config['source'].pop('url', None)
                
                try:
                    # For TMS layers, we'll create the layer directly with the tileUrlFunction
                    if is_tms and 'source' in layer_config and 'tileUrlFunction' in layer_config['source']:
                        # Get the tile URL function as a string
                        tile_func = layer_config['source'].pop('tileUrlFunction')
                        
                        # Create the layer directly with the tileUrlFunction
                        layer_js.append("""  new ol.layer.Tile({
  title: %s,
  type: 'TMS',
  visible: false,
  source: new ol.source.XYZ({
    url: '',
    tileUrlFunction: %s,
    attributions: %s,
    maxZoom: %s,
    minZoom: %s,
    crossOrigin: 'anonymous',
    tileSize: 256,
    projection: 'EPSG:3857'
  })
})""" % (
    json.dumps(layer_config.get('title', 'Unnamed Layer')),
    tile_func,
    json.dumps(layer_config.get('source', {}).get('attributions', '')),
    json.dumps(layer_config.get('source', {}).get('maxZoom', 19)),
    json.dumps(layer_config.get('source', {}).get('minZoom', 0))
))
                    else:
                        # For non-TMS layers, just use the config as is
                        layer_json = json.dumps(layer_config, indent=4, ensure_ascii=False)
                        layer_js.append(f"  new ol.layer.Tile({layer_json})")
                    
                    processed_count += 1
                    
                except Exception as e:
                    logger.error(f"Error generating layer JSON for '{layer.get('name', 'unnamed')}': {str(e)}")
                    logger.debug(f"Layer config: {layer_config}")
                    logger.debug(f"Error details: {traceback.format_exc()}")
                    continue
                
            except Exception as e:
                logger.error(f"Error processing layer '{layer.get('name', 'unnamed')}': {str(e)}")
                logger.debug(f"Layer data: {layer}")
                continue
        
        if not layer_js:
            logger.warning("No valid layers found for all_layers")
            return ""
        
        js_code += ",\n".join(layer_js)
        js_code += "\n];\n"
        
        # Add to global layers array if it exists
        js_code += """
// Add to global layers array if it exists
if (typeof window.layers === 'undefined') {
    window.layers = [];
}
window.layers = window.layers.concat(ALL_TMS_LAYERS);
"""
        
        logger.info(f"Processed {processed_count}/{len(layers_sorted)} layers for all_layers")
        return js_code

    def parse_xml(self):
        """Parse the XML file and extract TMS layer information."""
        try:
            # Define the namespace
            ns = {'ns': 'http://josm.openstreetmap.de/maps-1.0'}
            
            # Parse the XML file
            logger.info(f"Reading XML file: {self.xml_file}")
            
            try:
                # Parse the XML with the namespace
                tree = ET.parse(self.xml_file)
                root = tree.getroot()
                
                # Find all entries in the XML
                entries = root.findall('.//ns:entry', namespaces=ns)
                logger.info(f"Found {len(entries)} entries in the XML file")
                
                if not entries:
                    logger.warning("No entries found in the XML file")
                    return False
                
                # Process each entry
                for i, entry in enumerate(entries):
                    # Log progress every 10 entries
                    if i % 10 == 0 and i > 0:
                        logger.info(f"Processing entry {i+1}/{len(entries)}")
                    
                    try:
                        # Get the type element with namespace
                        type_elem = entry.find('ns:type', namespaces=ns)
                        if type_elem is None or type_elem.text is None:
                            logger.debug(f"Skipping entry {i+1}: No type element found")
                            continue
                            
                        entry_type = type_elem.text.strip().lower()
                        if entry_type != 'tms':
                            logger.debug(f"Skipping non-TMS entry of type: {entry_type}")
                            continue
                            
                        # Process the TMS entry
                        logger.debug(f"Processing TMS entry {i+1}...")
                        layer = self.process_entry(entry)
                        if layer:
                            self.layers.append(layer)
                            logger.debug(f"Successfully processed TMS layer: {layer.get('name', 'Unnamed')}")
                        else:
                            logger.debug(f"No layer returned for entry {i+1}")
                            
                    except Exception as e:
                        logger.error(f"Error processing entry {i+1}: {str(e)}")
                        logger.debug(traceback.format_exc())
                
                logger.info(f"Successfully processed {len(self.layers)} TMS layers")
                
                # Generate output files if we have layers
                if self.layers:
                    return self.generate_layer_files()
                else:
                    logger.warning("No valid TMS layers found to process")
                    return False
                    
            except ET.ParseError as e:
                logger.error(f"XML parsing error: {e}")
                if hasattr(e, 'position'):
                    logger.error(f"Error at line {e.position[0]}, column {e.position[1]}")
                return False
                
        except Exception as e:
            logger.error(f"XML parsing error: {str(e)}")
            if hasattr(e, 'position'):
                logger.error(f"Error at line {e.position[0]}, column {e.position[1]}")
            return False
            
        except Exception as e:
            logger.error(f"Error processing XML file: {str(e)}")
            import traceback
            logger.debug(f"Error details: {traceback.format_exc()}")
            return False

    def generate_layer_files(self):
        """Generate layer files for each country and a combined file."""
        import traceback
        
        if not self.layers:
            logger.warning("No layers to process. Skipping file generation.")
            return False
            
        logger.info(f"Generating layer files in {self.output_dir}...")
        
        # Initialize country_layers as a class variable
        self.country_layers = {}
        all_layers = []
        
        # Process each layer
        for layer in self.layers:
            try:
                # Skip if layer is not a dictionary
                if not isinstance(layer, dict):
                    logger.warning(f"Skipping invalid layer (not a dictionary): {layer}")
                    continue
                    
                name = layer.get('name', '').strip()
                url = layer.get('url', '').strip()
                attribution = layer.get('attribution', '').strip()
                country_code = layer.get('country_code', '').strip().upper() or 'GLOBAL'
                
                if not url:
                    logger.warning(f"Skipping layer '{name}' - No URL provided")
                    continue
                    
                # Clean and validate URL
                url = url.replace('"', '').replace("'", "").strip()
                if not (url.startswith('http://') or url.startswith('https://')):
                    logger.warning(f"Skipping layer '{name}' - Invalid URL: {url}")
                    continue
                
                min_zoom = int(layer.get('min_zoom', 0))
                max_zoom = int(layer.get('max_zoom', 19))
                
                # Determine if this is a TMS source
                is_tms = self.is_tms_url(url)
                
                # Handle different URL patterns
                url = url.replace('{switch:a,b,c}', '{a}')
                
                # Create the layer configuration as a dictionary
                # Escape special characters in the name and URL to prevent string formatting issues
                safe_name = name.replace('{', '{{').replace('}', '}}')
                safe_url = url.replace('{', '{{').replace('}', '}}')
                safe_attribution = attribution.replace('{', '{{').replace('}', '}}') if attribution else ''
                
                # Create a unique ID for the layer
                if country_code not in self.country_layers:
                    self.country_layers[country_code] = []
                layer_id = f"layer_{len(self.country_layers[country_code])}"
                
                layer_config = {
                    'id': layer_id,
                    'title': f"{safe_name} ({country_code})",
                    'type': 'TMS' if is_tms else 'XYZ',
                    'source': {
                        'type': 'XYZ',
                        'url': safe_url,
                        'attributions': safe_attribution,
                        'maxZoom': max_zoom,
                        'minZoom': min_zoom,
                        'crossOrigin': 'anonymous',
                        'tileSize': 256,
                        'projection': 'EPSG:3857'
                    },
                    'visible': False
                }
                
                # Add TMS-specific configuration
                if is_tms:
                    # Create a safe URL string with proper escaping
                    safe_url = url.replace('\\', '\\\\').replace("'", "\\'")
                    
                    # Create a simpler tile URL function that handles TMS Y coordinate conversion
                    safe_url = safe_url.replace('\\', '\\\\').replace("'", "\\'")
                    # Create a simple tile URL function that handles TMS Y coordinate conversion
                    tile_url_function = """function(tileCoord) {
                        if (!tileCoord || tileCoord.length < 3) return '';
                        
                        const z = tileCoord[0];
                        const x = tileCoord[1];
                        const y = tileCoord[2];
                        
                        if (isNaN(z) || isNaN(x) || isNaN(y)) return '';
                        
                        // Calculate TMS Y coordinate (invert the Y axis)
                        const tmsY = (1 << z) - y - 1;
                        
                        // Process the URL with placeholders
                        let url = '{0}';
                        
                        // Replace placeholders
                        url = url
                            .replace(/\\\\{\\{switch:[^}]+\\\\}\\}/g, 'a')
                            .replace(/\\{\\{z\\\}/g, z)
                            .replace(/\\{\\{x\\\}/g, x)
                            .replace(/\\{\\{-y\\\}/g, tmsY)
                            .replace(/\\{\\{!y\\\}/g, tmsY)
                            .replace(/([^\\])\\{(y)\\}/g, (m, p1) => p1 + tmsY)
                            .replace(/\\{\\{zoom\\\}/g, z)
                            .replace(/\\{\\{col\\\}/g, x)
                            .replace(/\\{\\{row\\\}/g, tmsY)
                            .replace(/([?&])[a-z]=[^&]*/g, '$1')
                            .replace(/[?&]$/, '');
                            
                        return url;
                    }""".format(safe_url.replace('\\', '\\\\').replace("'", "\\'"))
                    
                    # Add the tile URL function to the source
                    layer_config['source']['tileUrlFunction'] = tile_url_function
                    
                    # For TMS, we need to ensure the URL uses the tileUrlFunction
                    # Remove the URL from the source to avoid confusion
                    layer_config['source'].pop('url', None)
                
                # Add to country-specific layers
                if country_code not in self.country_layers:
                    self.country_layers[country_code] = []
                self.country_layers[country_code].append(layer_config)
                
                # Add to all layers if not already present
                if layer_config not in all_layers:
                    all_layers.append(layer_config)
                
            except Exception as e:
                logger.error(f"Error processing layer '{layer.get('name', 'unnamed')}': {str(e)}")
                logger.debug(f"Layer data: {layer}\nError details: {traceback.format_exc()}")
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Generate country-specific layer files
        for country_code, layers in self.country_layers.items():
            try:
                if not layers:
                    logger.warning(f"No layers found for country {country_code}")
                    continue
                    
                logger.info(f"Generating layers for country {country_code} ({len(layers)} layers)")
                js_code = self.generate_country_layers_js(country_code, layers)
                if js_code:
                    output_file = os.path.join(self.output_dir, f"tms_layers_{country_code}.js")
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(js_code)
                    logger.info(f"Generated {output_file}")
                
            except Exception as e:
                logger.error(f"Error generating layers for {country_code}: {e}")
                logger.debug(f"Error details: {traceback.format_exc()}")
        
        # Generate combined layer file
        if all_layers:
            logger.info(f"Generating combined layers file with {len(all_layers)} layers")
            js_code = self.generate_all_layers_js(all_layers)
            if js_code:
                output_file = os.path.join(self.output_dir, "all_tms_layers.js")
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(js_code)
                logger.info(f"Generated {output_file}")
        else:
            logger.warning("No layers to include in the combined file")
            
        logger.info("\nProcessing complete!")
        return True

def main():
    """Main function to parse command line arguments and run the processor."""
    parser = argparse.ArgumentParser(description='Process TMS layers from OSM imagery.xml file')
    parser.add_argument('--input', '-i', default='src/layers/imagery.xml',
                        help='Path to the imagery.xml file')
    parser.add_argument('--output', '-o', default='src/layers/generated',
                        help='Output directory for generated JavaScript files')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging')
    
    args = parser.parse_args()
    
    # Set log level
    if args.debug:
        logger.setLevel(logging.DEBUG)
    
    # Process the file
    processor = TmsLayerProcessor(args.input, args.output)
    success = processor.parse_xml()
    
    return 0 if success else 1

if __name__ == '__main__':
    import sys
    sys.exit(main())
