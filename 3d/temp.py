import csv

# List of key.value pairs from the task
pairs = [
    ('*-tip/pista', 'guagua'),
    ('4wd_only', 'recommended'),
    ('abandoned:amenity', 'prison'),
    ('abandoned:amenity', 'prison_camp'),
    ('abandoned:highway', 'path'),
    ('abandoned:highway', 'track'),
    ('abandoned:landuse', 'landfill'),
    ('abandoned:landuse', 'quarry'),
    ('abandoned:man_made', 'petroleum_well'),
    ('abandoned:man_made', 'pipeline'),
    ('abandoned:place', 'hamlet'),
    ('abandoned:railway', 'rail'),
    ('abandoned:railway', 'station'),
    ('abutters', 'industrial'),
    ('abutters', 'mixed'),
    ('abutters', 'residential'),
    ('abutters', 'retail'),
    ('access', 'agricultural'),
    ('access', 'bdouble')
]

# Read the CSV
data = {}
with open('sources/taginfo_definitions_consolidated.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) >= 5:
            key = row[0]
            value = row[1]
            definition_en = row[3] or row[4] or row[5]  # en, ca, es
            data[(key, value)] = definition_en

# Output the results
for key, value in pairs:
    desc = data.get((key, value), 'Not found')
    print(f"{key},{value}: {desc}")
