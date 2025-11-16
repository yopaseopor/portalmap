# Taginfo CSV Multilingual Definitions Generator

Aquest script genera definicions en anglès, català i castellà per a cada key d'OSM basant-se en un fitxer CSV de Taginfo.

## Funcionalitats

- **Generació Automàtica**: Crea definicions en 3 idiomes per cada key d'OSM
- **Traduccions Precises**: Utilitza un diccionari de definicions conegudes
- **Formatació de Nombres**: Formata els números de resultats amb separadors de milers
- **Ordenació per Popularitat**: Ordena els resultats per nombre total de resultats (descendent)

## Ús

```bash
python taginfo_definitions_generator.py
```

## Fitxer d'Entrada

El script llegeix dades de:
```
D:\_x\a\GitHub\_osmutils\export_test_taginfo.csv
```

Aquest fitxer ha de contenir columnes típiques de l'API de Taginfo:
- `key`: El nom del tag OSM
- `count_all`: Nombre total de vegades que s'utilitza
- `count_nodes`, `count_ways`, `count_relations`: Comptadors per tipus d'element
- `values`, `users`, `in_wiki`, `project`: Metadades addicionals

## Fitxer de Sortida

Es crea el fitxer:
```
D:\_x\a\GitHub\_osmutils\taginfo_definitions_multilang.csv
```

Amb les columnes:
- `key`: El nom del tag OSM
- `definition_en`: Definició en anglès
- `definition_ca`: Definició en català
- `definition_es`: Definició en castellà
- `total_results`: Nombre total de resultats (formatat)
- `count_all`: Nombre total sense formatar
- `count_nodes`, `count_ways`, `count_relations`: Comptadors individuals
- `values`, `users`, `in_wiki`, `project`: Metadades

## Com Funciona la Generació de Definicions

### 1. Diccionari de Definicions Conegudes
El script té un diccionari predefinit amb definicions per als keys més comuns:

```python
TAG_DEFINITIONS = {
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
    # ... més definicions
}
```

### 2. Generació Automàtica per Patrons
Per als keys no definits explícitament, el script busca patrons:

```python
key_patterns = {
    'addr': {'en': 'Address information', 'ca': 'Informació d\'adreça', 'es': 'Información de dirección'},
    'name': {'en': 'Name or label', 'ca': 'Nom o etiqueta', 'es': 'Nombre o etiqueta'},
    'maxspeed': {'en': 'Maximum allowed speed', 'ca': 'Velocitat màxima permesa', 'es': 'Velocidad máxima permitida'},
    # ... més patrons
}
```

### 3. Fallback Genèric
Per als keys que no coincideixen amb cap patró, es genera una definició genèrica:

```python
{
    'en': f'Property or attribute: {key}',
    'ca': f'Propietat o atribut: {key}',
    'es': f'Propiedad o atributo: {key}'
}
```

## Exemples de Sortida

```
1. amenity:
   English: A place that provides a service or facility for the public
   Catalan: Un lloc que proporciona un servei o instal·lació per al públic
   Spanish: Un lugar que proporciona un servicio o instalación para el público
   Total Results: 12,345,678

2. shop:
   English: A place where goods or services are sold to the public
   Catalan: Un lloc on es venen béns o serveis al públic
   Spanish: Un lugar donde se venden bienes o servicios al público
   Total Results: 8,765,432

3. addr:housenumber:
   English: Address information
   Catalan: Informació d'adreça
   Spanish: Información de dirección
   Total Results: 5,432,109
```

## Personalització

Per afegir més definicions, edita el diccionari `TAG_DEFINITIONS` al script:

```python
TAG_DEFINITIONS['new_key'] = {
    'en': 'Your English definition',
    'ca': 'La teva definició en català',
    'es': 'Tu definición en español'
}
```

## Requisits

- Python 3.x
- Fitxer CSV d'entrada vàlid amb dades de Taginfo

## Limitacions

- Les definicions són aproximades i basades en el nom del key
- No cobreix tots els keys possibles d'OSM
- Les traduccions són literals i poden requerir revisió humana

## Aplicacions

Aquest script és útil per:
- Crear documentació multilingüe d'etiquetes OSM
- Generar materials educatius sobre OpenStreetMap
- Crear catàlegs de tags amb explicacions en múltiples idiomes
- Facilitar la comprensió d'etiquetes OSM per a nous contribuïdors
