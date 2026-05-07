# Toll Management Commands

## demo_ocr_traversal

Runs a demo flow that:
- reads two images with OCR,
- creates an entry TollCapture at toll A,
- creates an exit TollCapture at toll B,
- produces a TollTraversal and fine (if speeding).

### Usage

```bash
cd /home/mihail/Projects/speeding-detection-system/speed_detection
/home/mihail/Projects/speeding-detection-system/venv/bin/python manage.py demo_ocr_traversal
```

### Options

- `--entry-toll` Toll code or ID (default `ROM`)
- `--exit-toll` Toll code or ID (default `PET`)
- `--entry-image` Path to entry image (default `services/pictures/5.png`)
- `--exit-image` Path to exit image (default `services/pictures/6.png`)
- `--minutes-between` Minutes between captures (default `10`)
- `--plate-text` Force a plate text (overrides OCR)
- `--allow-empty` Allow empty plate text (no traversal created)

### Example

```bash
cd /home/mihail/Projects/speeding-detection-system/speed_detection
/home/mihail/Projects/speeding-detection-system/venv/bin/python manage.py demo_ocr_traversal \
  --entry-toll ROM \
  --exit-toll PET \
  --entry-image services/pictures/5.png \
  --exit-image services/pictures/6.png \
  --minutes-between 8
```

