#!/usr/bin/env python3
"""
Script de verificació per validar la qualitat de la consolidació CSV
"""

import csv
from collections import defaultdict

def verify_consolidation(original_file, consolidated_file):
    """Verifica que la consolidació ha funcionat correctament"""

    print("=== VERIFICACIÓ DE CONSOLIDACIÓ ===")

    # Llegir fitxers
    original_data = {}
    with open(original_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if len(row) >= 2:
                key = row[0].strip() if row[0] else ""
                value = row[1].strip() if row[1] else ""
                key_value = f"{key}={value}"
                if key_value not in original_data:
                    original_data[key_value] = []
                original_data[key_value].append(row)

    consolidated_data = {}
    with open(consolidated_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if len(row) >= 2:
                key = row[0].strip() if row[0] else ""
                value = row[1].strip() if row[1] else ""
                key_value = f"{key}={value}"
                consolidated_data[key_value] = row

    print(f"Files originals: {sum(len(rows) for rows in original_data.values())}")
    print(f"Grups originals: {len(original_data)}")
    print(f"Files consolidades: {len(consolidated_data)}")

    # Verificar que tots els key=value originals estan presents
    missing_keys = set(original_data.keys()) - set(consolidated_data.keys())
    if missing_keys:
        print(f"⚠️  FALTEN {len(missing_keys)} key=value al fitxer consolidat!")
        print(f"Exemples: {list(missing_keys)[:5]}")
    else:
        print("✅ Tots els key=value originals estan presents")

    # Verificar que no s'ha perdut informació crítica
    print("\n=== VERIFICACIÓ D'INFORMACIÓ ===")

    sample_keys = ['4wd_only=yes', 'abandoned=yes', 'highway=track']
    for key in sample_keys:
        if key in original_data and key in consolidated_data:
            orig_rows = original_data[key]
            consol_row = consolidated_data[key]

            print(f"\n{key}:")
            print(f"  Files originals: {len(orig_rows)}")

            # Verificar estadístiques (columna count_all)
            orig_stats = [row[6] for row in orig_rows if len(row) > 6 and row[6].strip()]
            consol_stat = consol_row[6] if len(consol_row) > 6 else ""

            if orig_stats and consol_stat:
                max_orig = max([int(x) for x in orig_stats if x.isdigit()])
                if consol_stat.isdigit() and int(consol_stat) >= max_orig:
                    print(f"  ✅ Estadístiques consolidades correctament: {consol_stat}")
                else:
                    print(f"  ⚠️  Estadístiques inconsistents: {consol_stat} vs màx original {max_orig}")
            elif consol_stat:
                print(f"  ✅ Estadístiques afegides: {consol_stat}")
            else:
                print("  ℹ️  Sense estadístiques")

            # Verificar definicions
            orig_defs = []
            for row in orig_rows:
                if len(row) > 4:  # definition_ca
                    orig_defs.extend([row[i] for i in [3,4,5] if i < len(row) and row[i].strip()])

            consol_defs = [consol_row[i] for i in [3,4,5] if i < len(consol_row) and consol_row[i].strip()]

            if orig_defs or consol_defs:
                print(f"  Definició original: {len(orig_defs)} camps, consolidada: {len(consol_defs)} camps")

    print("\n=== ESTADÍSTIQUES GENERALS ===")
    # Comptar tipus de dades
    stats_types = defaultdict(int)
    def_types = defaultdict(int)

    for key, row in consolidated_data.items():
        if len(row) > 6 and row[6].strip():
            stats_types['amb_estadistiques'] += 1
        else:
            stats_types['sense_estadistiques'] += 1

        has_def = any(len(row) > i and row[i].strip() for i in [3,4,5])
        if has_def:
            def_types['amb_definicions'] += 1
        else:
            def_types['sense_definicions'] += 1

    print(f"Files amb estadístiques: {stats_types['amb_estadistiques']}")
    print(f"Files sense estadístiques: {stats_types['sense_estadistiques']}")
    print(f"Files amb definicions: {def_types['amb_definicions']}")
    print(f"Files sense definicions: {def_types['sense_definicions']}")

    print("\n✅ Verificació completada!")

if __name__ == "__main__":
    original_file = r"d:\_x\a\GitHub\_osmutils\osmkeyvalue\taginfo_definitions.csv"
    consolidated_file = r"d:\_x\a\GitHub\_osmutils\osmkeyvalue\taginfo_definitions_consolidated.csv"

    verify_consolidation(original_file, consolidated_file)
