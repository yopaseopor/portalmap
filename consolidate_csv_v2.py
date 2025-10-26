#!/usr/bin/env python3
"""
Script per consolidar el fitxer taginfo_definitions.csv
Agrupa per key+value i combina tota la informació disponible
Millora: Gestiona correctament els separadors CSV
"""

import csv
import sys
from collections import defaultdict

def combine_text_fields(values):
    """Combina valors de text, eliminant duplicats i buits"""
    if not values:
        return ""

    # Filtrar valors no buits i eliminar duplicats
    unique_values = []
    for value in values:
        if value and str(value).strip() and str(value).strip() not in unique_values:
            unique_values.append(str(value).strip())

    if not unique_values:
        return ""

    # Si només hi ha un valor, retornar-lo
    if len(unique_values) == 1:
        return unique_values[0]

    # Si hi ha múltiples valors, combinar-los amb separadors apropiats
    return " | ".join(unique_values)

def combine_numeric_fields(values):
    """Combina valors numèrics, agafant el màxim no-zero"""
    if not values:
        return ""

    # Filtrar valors no buits
    numeric_values = []
    for value in values:
        if value and str(value).strip():
            try:
                num_val = float(str(value).strip())
                if num_val > 0:
                    numeric_values.append(num_val)
            except (ValueError, TypeError):
                continue

    if not numeric_values:
        return ""

    # Retornar el màxim valor
    return str(int(max(numeric_values)))

def combine_boolean_fields(values):
    """Combina valors boolean, agafant 'Yes' si n'hi ha cap"""
    if not values:
        return ""

    for value in values:
        if value and str(value).strip().lower() in ['yes', 'true', '1']:
            return 'Yes'

    return 'No'

def process_csv(input_file, output_file):
    """Processa el CSV i consolida les dades duplicades"""

    # Llegir totes les files
    rows_by_key_value = defaultdict(list)

    with open(input_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        header = next(reader)  # Llegir la capçalera

        for row in reader:
            if len(row) >= 2:
                key = row[0].strip() if row[0] else ""
                value = row[1].strip() if row[1] else ""
                key_value = f"{key}={value}"

                rows_by_key_value[key_value].append(row)

    print(f"Processant {len(rows_by_key_value)} grups de key=value únics")

    # Processar cada grup
    consolidated_rows = []

    for key_value, rows in rows_by_key_value.items():
        if not rows:
            continue

        # Crear una fila consolidada
        consolidated_row = [''] * len(header)

        # Omplir key i value
        if rows[0] and len(rows[0]) > 0:
            consolidated_row[0] = rows[0][0]  # key
        if rows[0] and len(rows[0]) > 1:
            consolidated_row[1] = rows[0][1]  # value

        # Processar cada columna
        for col_idx in range(2, len(header)):
            column_values = []

            for row in rows:
                if row and len(row) > col_idx and row[col_idx]:
                    column_values.append(row[col_idx])

            if col_idx == 2:  # tag column
                consolidated_row[col_idx] = combine_text_fields(column_values)
            elif col_idx <= 5:  # definition columns (en, ca, es)
                consolidated_row[col_idx] = combine_text_fields(column_values)
            elif col_idx <= 13:  # count columns (numeric)
                consolidated_row[col_idx] = combine_numeric_fields(column_values)
            elif col_idx == 14:  # in_wiki (boolean)
                consolidated_row[col_idx] = combine_boolean_fields(column_values)
            elif col_idx == 15:  # projects (numeric)
                consolidated_row[col_idx] = combine_numeric_fields(column_values)
            elif col_idx <= 19:  # translation columns
                consolidated_row[col_idx] = combine_text_fields(column_values)
            elif col_idx == 20:  # number4wd_only (numeric)
                consolidated_row[col_idx] = combine_numeric_fields(column_values)
            elif col_idx == 21:  # recommended (boolean)
                consolidated_row[col_idx] = combine_boolean_fields(column_values)
            elif col_idx == 22:  # 4wd_only=recommended (boolean)
                consolidated_row[col_idx] = combine_boolean_fields(column_values)

        consolidated_rows.append(consolidated_row)

    # Ordenar per key, value
    consolidated_rows.sort(key=lambda x: (x[0] if x[0] else "", x[1] if x[1] else ""))

    # Escriure el resultat amb csv.writer per gestionar correctament els separadors
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(header)
        for row in consolidated_rows:
            writer.writerow(row)

    print(f"Escrites {len(consolidated_rows)} files consolidades a {output_file}")

    # Verificar el resultat
    print("\nVerificació d'algunes entrades consolidades:")
    with open(output_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Saltar header

        found_4wd = False
        found_abandoned = False

        for row in reader:
            if row and len(row) >= 2:
                if row[0] == '4wd_only' and row[1] == 'yes' and not found_4wd:
                    print(f"4wd_only=yes: estadístiques={row[6]}, definició_en='{row[3]}', definició_ca='{row[4]}', definició_es='{row[5]}'")
                    found_4wd = True
                elif row[0] == 'abandoned' and row[1] == 'yes' and not found_abandoned:
                    print(f"abandoned=yes: estadístiques={row[6]}, definició_en='{row[3]}', definició_ca='{row[4]}', definició_es='{row[5]}'")
                    found_abandoned = True

                if found_4wd and found_abandoned:
                    break

if __name__ == "__main__":
    input_file = r"d:\_x\a\GitHub\_osmutils\osmkeyvalue\taginfo_definitions.csv"
    output_file = r"d:\_x\a\GitHub\_osmutils\osmkeyvalue\taginfo_definitions_consolidated.csv"

    process_csv(input_file, output_file)
