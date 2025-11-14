#!/usr/bin/env python3
"""
Taginfo CSV Translator and Definition Generator
Creates definitions in English, Catalan, and Spanish for OSM tag keys
"""

import csv
import re
from collections import defaultdict

# OSM Tag definitions in multiple languages
TAG_DEFINITIONS = {
    # Common amenity tags
    'amenity': {
        'en': 'A place that provides a service or facility for the public',
        'ca': 'Un lloc que proporciona un servei o instal·lació per al públic',
        'es': 'Un lugar que proporciona un servicio o instalación para el público'
    },
    'shop': {
        'en': 'A place where goods or services are sold to the public',
        'ca': 'Un lloc on es venen béns o serveis al públic',
        'es': 'Un lugar donde se venden bienes o servicios al público'
    },
    'highway': {
        'en': 'A road, street, path, or way for vehicles, pedestrians, or cyclists',
        'ca': 'Un camí, carrer, ruta o via per a vehicles, vianants o ciclistes',
        'es': 'Un camino, calle, ruta o vía para vehículos, peatones o ciclistas'
    },
    'building': {
        'en': 'A permanent structure with walls and a roof',
        'ca': 'Una estructura permanent amb parets i sostre',
        'es': 'Una estructura permanente con paredes y techo'
    },
    'landuse': {
        'en': 'The primary use of a piece of land',
        'ca': 'L\'ús principal d\'un terreny',
        'es': 'El uso principal de un terreno'
    },
    'natural': {
        'en': 'A natural feature on the Earth\'s surface',
        'ca': 'Una característica natural a la superfície de la Terra',
        'es': 'Una característica natural en la superficie de la Tierra'
    },
    'waterway': {
        'en': 'A natural or artificial watercourse',
        'ca': 'Un curs d\'aigua natural o artificial',
        'es': 'Un curso de agua natural o artificial'
    },
    'railway': {
        'en': 'Railway infrastructure and facilities',
        'ca': 'Infraestructura i instal·lacions ferroviàries',
        'es': 'Infraestructura e instalaciones ferroviarias'
    },
    'aeroway': {
        'en': 'Airport and aviation-related facilities',
        'ca': 'Aeroport i instal·lacions relacionades amb l\'aviació',
        'es': 'Aeropuerto e instalaciones relacionadas con la aviación'
    },
    'tourism': {
        'en': 'Tourist attractions and accommodation',
        'ca': 'Atraccions turístiques i allotjament',
        'es': 'Atracciones turísticas y alojamiento'
    },
    'historic': {
        'en': 'Historical or culturally significant sites',
        'ca': 'Llocs històrics o culturalment significatius',
        'es': 'Sitios históricos o culturalmente significativos'
    },
    'military': {
        'en': 'Military facilities and infrastructure',
        'ca': 'Instal·lacions i infraestructures militars',
        'es': 'Instalaciones e infraestructuras militares'
    },
    'emergency': {
        'en': 'Emergency services and facilities',
        'ca': 'Serveis i instal·lacions d\'emergència',
        'es': 'Servicios e instalaciones de emergencia'
    },
    'healthcare': {
        'en': 'Healthcare facilities and services',
        'ca': 'Instal·lacions i serveis sanitaris',
        'es': 'Instalaciones y servicios sanitarios'
    },
    'education': {
        'en': 'Educational institutions and facilities',
        'ca': 'Institucions i instal·lacions educatives',
        'es': 'Instituciones e instalaciones educativas'
    }
}

def generate_tag_definition(key, value=None):
    """
    Generate definitions for a tag key (and optionally value)
    """
    key_lower = key.lower()

    # Try exact match first
    if key_lower in TAG_DEFINITIONS:
        return TAG_DEFINITIONS[key_lower]

    # Try to find partial matches or generate based on key name
    definition_base = generate_definition_from_key(key)

    return {
        'en': definition_base['en'],
        'ca': definition_base['ca'],
        'es': definition_base['es']
    }

def generate_definition_from_key(key):
    """
    Generate a definition based on the key name when exact match isn't found
    """
    key_lower = key.lower()

    # Common OSM key patterns and their meanings
    key_patterns = {
        'addr': {
            'en': 'Address information',
            'ca': 'Informació d\'adreça',
            'es': 'Información de dirección'
        },
        'name': {
            'en': 'Name or label',
            'ca': 'Nom o etiqueta',
            'es': 'Nombre o etiqueta'
        },
        'ref': {
            'en': 'Reference number or code',
            'ca': 'Número o codi de referència',
            'es': 'Número o código de referencia'
        },
        'source': {
            'en': 'Source of the data',
            'ca': 'Font de les dades',
            'es': 'Fuente de los datos'
        },
        'note': {
            'en': 'Additional notes or comments',
            'ca': 'Notes o comentaris addicionals',
            'es': 'Notas o comentarios adicionales'
        },
        'fixme': {
            'en': 'Issue that needs to be fixed',
            'ca': 'Problema que cal solucionar',
            'es': 'Problema que necesita ser solucionado'
        },
        'maxspeed': {
            'en': 'Maximum allowed speed',
            'ca': 'Velocitat màxima permesa',
            'es': 'Velocidad máxima permitida'
        },
        'surface': {
            'en': 'Surface material or type',
            'ca': 'Material o tipus de superfície',
            'es': 'Material o tipo de superficie'
        },
        'access': {
            'en': 'Access restrictions',
            'ca': 'Restriccions d\'accés',
            'es': 'Restricciones de acceso'
        },
        'cycleway': {
            'en': 'Cycling infrastructure',
            'ca': 'Infraestructura ciclista',
            'es': 'Infraestructura ciclista'
        },
        'footway': {
            'en': 'Pedestrian infrastructure',
            'ca': 'Infraestructura per a vianants',
            'es': 'Infraestructura para peatones'
        },
        'oneway': {
            'en': 'One-way traffic direction',
            'ca': 'Direcció de trànsit d\'un sol sentit',
            'es': 'Dirección de tráfico de un solo sentido'
        },
        'lanes': {
            'en': 'Number of lanes',
            'ca': 'Nombre de carrils',
            'es': 'Número de carriles'
        },
        'lit': {
            'en': 'Lighting availability',
            'ca': 'Disponibilitat d\'enllumenat',
            'es': 'Disponibilidad de iluminación'
        },
        'covered': {
            'en': 'Whether something is covered or protected',
            'ca': 'Si alguna cosa està coberta o protegida',
            'es': 'Si algo está cubierto o protegido'
        }
    }

    # Check for pattern matches
    for pattern, definition in key_patterns.items():
        if pattern in key_lower:
            return definition

    # Generate a generic definition based on the key name
    generic_def = {
        'en': f'Property or attribute: {key}',
        'ca': f'Propietat o atribut: {key}',
        'es': f'Propiedad o atributo: {key}'
    }

    return generic_def

def format_number(num_str):
    """Format number with thousands separator"""
    try:
        return f"{int(num_str):,}"
    except:
        return num_str

def main():
    input_file = r"D:\_x\a\GitHub\_osmutils\export_test_taginfo.csv"

    # Read the input CSV
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)

        # Prepare output data
        output_data = []

        for row in reader:
            key = row.get('key', '').strip()
            count_all = row.get('count_all', '0')

            if not key:
                continue

            # Generate definitions for this key
            definitions = generate_tag_definition(key)

            # Create output row
            output_row = {
                'key': key,
                'definition_en': definitions['en'],
                'definition_ca': definitions['ca'],
                'definition_es': definitions['es'],
                'total_results': format_number(count_all),
                'count_all': count_all,
                'count_nodes': row.get('count_nodes', '0'),
                'count_ways': row.get('count_ways', '0'),
                'count_relations': row.get('count_relations', '0'),
                'values': row.get('values', '0'),
                'users': row.get('users', '0'),
                'in_wiki': row.get('in_wiki', '0'),
                'project': row.get('project', '')
            }

            output_data.append(output_row)

    # Sort by total count (descending)
    output_data.sort(key=lambda x: int(x['count_all']), reverse=True)

    # Write output CSV
    output_file = r"D:\_x\a\GitHub\_osmutils\taginfo_definitions_multilang.csv"

    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        fieldnames = [
            'key', 'definition_en', 'definition_ca', 'definition_es',
            'total_results', 'count_all', 'count_nodes', 'count_ways',
            'count_relations', 'values', 'users', 'in_wiki', 'project'
        ]

        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in output_data:
            writer.writerow(row)

    print("✅ Successfully created multilingual definitions CSV!"    print(f"📁 Output file: {output_file}")
    print(f"📊 Total keys processed: {len(output_data)}")

    # Show some examples
    print("\n📋 Examples of generated definitions:")
    for i, row in enumerate(output_data[:5]):
        print(f"{i+1}. {row['key']}:")
        print(f"   EN: {row['definition_en']}")
        print(f"   CA: {row['definition_ca']}")
        print(f"   ES: {row['definition_es']}")
        print(f"   Results: {row['total_results']}")
        print()

if __name__ == "__main__":
    main()
