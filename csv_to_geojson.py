import csv
import json

def csv_to_geojson(csv_file, geojson_file):
    features = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                # Extract coordinates
                lon = float(row['경도(초/100)'])
                lat = float(row['위도(초/100)'])
                
                # Create GeoJSON feature
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "properties": {k: v for k, v in row.items()}
                }
                features.append(feature)
            except ValueError:
                print(f"Skipping row with invalid coordinates: {row}")

    # Create FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # Save to file
    with open(geojson_file, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)

# Usage
csv_to_geojson('coordinates.csv', 'output.json')