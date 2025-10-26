#!/usr/bin/env python3
"""Check the structure of the imagery.xml file."""
import xml.etree.ElementTree as ET

def main():
    # Parse the XML file
    tree = ET.parse('src/layers/imagery.xml')
    root = tree.getroot()
    
    # Print root tag and namespace
    print(f"Root tag: {root.tag}")
    print(f"Root attributes: {root.attrib}")
    
    # Define the namespace
    ns = {'ns': 'http://josm.openstreetmap.de/maps-1.0'}
    
    # Count total entries
    entries = root.findall('.//ns:entry', namespaces=ns)
    print(f"Total entries: {len(entries)}")
    
    # Find all unique types
    types = set()
    for entry in entries:
        type_elem = entry.find('ns:type', namespaces=ns)
        if type_elem is not None and type_elem.text:
            types.add(type_elem.text.strip().lower())
    
    print(f"Available types: {types}")
    
    # Count entries by type
    type_counts = {}
    for t in types:
        count = len(root.findall(f'.//ns:entry[ns:type="{t}"]', namespaces=ns))
        type_counts[t] = count
    
    print("\nEntry counts by type:")
    for t, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {t}: {count}")
    
    # Print first few entries for each type
    print("\nSample entries for each type:")
    for t in types:
        print(f"\nType: {t}")
        sample_entries = root.findall(f'.//ns:entry[ns:type="{t}"]', namespaces=ns)[:2]
        for i, entry in enumerate(sample_entries, 1):
            print(f"  Sample {i}:")
            for child in entry:
                tag = child.tag.split('}')[-1]  # Remove namespace
                print(f"    {tag}: {child.text}")

if __name__ == "__main__":
    main()
