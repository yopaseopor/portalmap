#!/usr/bin/env python3
"""
Debug script to inspect the structure of the imagery.xml file.
"""
import xml.etree.ElementTree as ET
import logging

def setup_logging():
    """Configure logging."""
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('debug_xml.log')
        ]
    )
    return logging.getLogger(__name__)

def main():
    """Main function to debug XML structure."""
    logger = setup_logging()
    xml_file = 'src/layers/imagery.xml'
    
    try:
        # Parse the XML file
        logger.info(f"Parsing {xml_file}...")
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        # Print root element info
        logger.info(f"Root element: {root.tag}")
        logger.info(f"Root attributes: {root.attrib}")
        
        # Register the namespace
        ns = {'ns': 'http://josm.openstreetmap.de/maps-1.0'}
        
        # Find all entries
        entries = root.findall('.//ns:entry', namespaces=ns)
        logger.info(f"Found {len(entries)} entries in total")
        
        # Find TMS entries
        tms_entries = root.findall(".//ns:entry[ns:type='tms']", namespaces=ns)
        logger.info(f"Found {len(tms_entries)} TMS entries")
        
        # Print first few TMS entries for inspection
        for i, entry in enumerate(tms_entries[:5]):
            logger.info(f"\nTMS Entry {i+1}:")
            for child in entry:
                tag = child.tag.split('}')[-1]  # Remove namespace
                logger.info(f"  {tag}: {child.text}")
        
        # Check if we can find elements directly
        logger.info("\nTesting direct element finding:")
        for i, entry in enumerate(tms_entries[:1]):
            logger.info(f"\nTesting entry {i+1}:")
            
            # Method 1: Direct access with namespace
            name = entry.find('ns:name', namespaces=ns)
            url = entry.find('ns:url', namespaces=ns)
            type_elem = entry.find('ns:type', namespaces=ns)
            
            logger.info(f"Method 1 - Name: {name.text if name else 'None'}")
            logger.info(f"Method 1 - URL: {url.text if url else 'None'}")
            logger.info(f"Method 1 - Type: {type_elem.text if type_elem else 'None'}")
            
            # Method 2: Iterate through children
            logger.info("\nAll children:")
            for child in entry:
                tag = child.tag.split('}')[-1]  # Remove namespace
                logger.info(f"  {tag}: {child.text}")
        
        logger.info("\nDebugging completed successfully!")
        
    except ET.ParseError as e:
        logger.error(f"XML parsing error: {e}")
        logger.error(f"Error at line {e.position[0]}, column {e.position[1]}")
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)

if __name__ == "__main__":
    main()
