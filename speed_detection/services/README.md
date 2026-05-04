# Services

## Plate OCR demo

This demo runs EasyOCR on a folder of images and prints JSON per image.

### Environment

Install OCR dependencies:

```
pip install -r /home/mihail/Projects/speeding-detection-system/speed_detection/requirements.txt
```

### Run

```
python -u /home/mihail/Projects/speeding-detection-system/speed_detection/services/demo_plate_ocr.py \
  --folder /path/to/images
```

### Django persistence

To store results in `TollCapture` rows, use the management command:

```
python /home/mihail/Projects/speeding-detection-system/speed_detection/manage.py \
  ocr_plates_from_folder \
  --folder /path/to/images \
  --toll-id 1 \
  --persist
```

## Google Maps demo

This demo uses the Google Places Text Search + Place Details APIs to fetch the richest metadata available for a toll station in North Macedonia.

### Environment

Set an API key with Places API enabled:

```
export GOOGLE_MAPS_API_KEY="YOUR_KEY"
```

### Run

```
python -u /home/mihail/Projects/speeding-detection-system/speed_detection/services/demo_google_maps.py
```

### Notes

- The demo returns both the text search results and place details payloads.
- Update the query in `services/google_maps.py` if you want a specific station name.

### Free-tier setup (recommended)

1. Create a Google Cloud project.
2. Enable billing (required even for the free monthly credit).
3. Enable these APIs:
   - Places API (for the demo)
   - Distance Matrix API (for toll-to-toll times)
   - Directions API (optional)
4. Create an API key and apply restrictions:
   - Application restriction: None for local demos, then lock down to server IPs.
   - API restrictions: limit to the enabled APIs above.
5. Use the free monthly credit to avoid charges; set a budget alert if desired.

## OSRM demo (free)

This demo uses the public OSRM routing service to estimate travel time between two coordinates.

### Environment

Optionally set a custom OSRM base URL:

```
export OSRM_BASE_URL="https://router.project-osrm.org"
```

### Run

```
python -u /home/mihail/Projects/speeding-detection-system/speed_detection/services/demo_osrm.py
```

### Comparison notes

- OSRM public demo is free but rate-limited and not guaranteed for production.
- OSRM returns distance (meters) and duration (seconds) similar to Maps routing.
- For production, self-host OSRM or use a hosted provider.
