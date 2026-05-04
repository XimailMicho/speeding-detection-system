import os
import re
import sys
from pathlib import Path

import cv2
import numpy as np
from easyocr import Reader

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
EASYOCR_MODEL_DIR = BASE_DIR / "easyocr_models"
EASYOCR_USER_NETWORK_DIR = BASE_DIR / "easyocr_user_network"
DEFAULT_MODEL_PATH = BASE_DIR / 'models/vgg16/model_500.h5'
PLATE_PATTERN = re.compile(r"^([A-Z]{2})(\d{3,4})([A-Z]{2})$")
NUMBER_SUFFIX_PATTERN = re.compile(r"^(\d{3,5})([A-Z]{2})$")
KNOWN_REGION_CODES = {
    "BG",
    "BT",
    "GV",
    "KO",
    "KU",
    "NE",
    "OH",
    "PP",
    "PR",
    "SK",
    "SR",
    "ST",
    "TE",
    "VE",
}
DIGIT_OCR_TRANSLATION = str.maketrans({
    "O": "0",
    "Q": "0",
    "I": "1",
    "L": "1",
    "Z": "2",
    "S": "5",
    "B": "8",
    "G": "6",
})


def normalize_text(text):
    return re.sub(r"[^A-Za-z0-9]", "", text or "").upper()


def format_plate(text):
    normalized = normalize_text(text)
    match = PLATE_PATTERN.fullmatch(normalized)
    if not match:
        match = fuzzy_plate_match(normalized)
        if not match:
            return None
    region, numbers, suffix = match.groups()
    return f"{region} {numbers} {suffix}"


def region_bonus(plate):
    region = plate.split()[0]
    return 1.0 if region in KNOWN_REGION_CODES else 0.0


def fuzzy_plate_match(normalized):
    for candidate in plate_text_variants(normalized):
        match = PLATE_PATTERN.fullmatch(candidate)
        if match:
            return match
    return None


def plate_text_variants(normalized):
    if not normalized:
        return []

    variants = []

    def add_variant(candidate):
        if candidate and candidate not in variants:
            variants.append(candidate)

    add_variant(normalized)

    # The blue country strip next to the plate is often read as an extra
    # character after BG, e.g. BGE1812SLT should become BG1812SL.
    bg_match = re.match(r"^(BG)[A-Z]+([A-Z0-9]{3,4})([A-Z]{2})([A-Z0-9]*)$", normalized)
    if bg_match:
        region, number_part, suffix, _ = bg_match.groups()
        add_variant(region + number_part.translate(DIGIT_OCR_TRANSLATION) + suffix)

    if not normalized.startswith("BG"):
        generic_match = re.search(r"([A-Z]{2})([A-Z0-9]{3,4})([A-Z]{2})", normalized)
        if generic_match:
            region, number_part, suffix = generic_match.groups()
            add_variant(region + number_part.translate(DIGIT_OCR_TRANSLATION) + suffix)

    trimmed = normalized
    while len(trimmed) > 8:
        trimmed = trimmed[:-1]
        add_variant(trimmed)

    return variants


def bbox_bounds(bbox):
    xs = [int(point[0]) for point in bbox]
    ys = [int(point[1]) for point in bbox]
    return min(xs), min(ys), max(xs), max(ys)


def crop_bounds(image_shape, bbox, padding=25):
    height, width = image_shape[:2]
    x1, y1, x2, y2 = bbox_bounds(bbox)
    return (
        max(0, x1 - padding),
        max(0, y1 - padding),
        min(width, x2 + padding),
        min(height, y2 + padding),
    )


def is_plate_region(text, bbox):
    normalized = normalize_text(text)
    x1, y1, x2, y2 = bbox_bounds(bbox)
    width = max(1, x2 - x1)
    height = max(1, y2 - y1)
    aspect_ratio = width / height

    if format_plate(normalized):
        return True
    if len(normalized) < 5 or len(normalized) > 9:
        return False
    if not (2.0 <= aspect_ratio <= 6.5):
        return False
    return bool(re.search(r"[A-Z]{1,3}", normalized) and re.search(r"\d{2,4}", normalized))


def read_plate_from_crop(reader, crop):
    scaled = cv2.resize(crop, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY)
    variants = [scaled, gray]
    candidates = []

    for variant in variants:
        results = reader.readtext(
            variant,
            detail=1,
            paragraph=False,
            allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        )
        if not results:
            continue

        ordered = sorted(results, key=lambda item: bbox_bounds(item[0])[0])
        joined_text = "".join(item[1] for item in ordered)
        formatted = format_plate(joined_text)
        if formatted:
            confidence = sum(float(item[2]) for item in ordered) / len(ordered)
            candidates.append((formatted, confidence))

    if not candidates:
        return None
    return max(candidates, key=lambda item: item[1])


def normalize_number_suffix(text):
    normalized = normalize_text(text)
    match = NUMBER_SUFFIX_PATTERN.fullmatch(normalized)
    if not match:
        return None

    numbers, suffix = match.groups()
    numbers = numbers.translate(DIGIT_OCR_TRANSLATION)
    while len(numbers) > 4:
        numbers = numbers[1:]

    if len(numbers) < 3:
        return None
    return numbers, suffix


def assemble_plate_candidates(ocr_results):
    ordered = sorted(ocr_results, key=lambda item: bbox_bounds(item[0])[0])
    candidates = []

    for index, (region_bbox, region_text, region_confidence) in enumerate(ordered):
        region = normalize_text(region_text)
        if len(region) != 2 or not region.isalpha() or region not in KNOWN_REGION_CODES:
            continue

        rx1, ry1, rx2, ry2 = bbox_bounds(region_bbox)
        for number_bbox, number_text, number_confidence in ordered[index + 1:]:
            nx1, ny1, nx2, ny2 = bbox_bounds(number_bbox)
            if nx1 <= rx2:
                continue
            if abs(((ry1 + ry2) / 2) - ((ny1 + ny2) / 2)) > max(ry2 - ry1, ny2 - ny1):
                continue

            number_suffix = normalize_number_suffix(number_text)
            if not number_suffix:
                continue

            numbers, suffix = number_suffix
            plate = f"{region} {numbers} {suffix}"
            confidence = (float(region_confidence) + float(number_confidence)) / 2 + region_bonus(plate)
            combined_bbox = [
                [min(rx1, nx1), min(ry1, ny1)],
                [max(rx2, nx2), min(ry1, ny1)],
                [max(rx2, nx2), max(ry2, ny2)],
                [min(rx1, nx1), max(ry2, ny2)],
            ]
            candidates.append((plate, confidence, combined_bbox))

    return candidates

path = sys.argv[1] if len(sys.argv) > 1 else None

if path is None or path == '':
    raise ValueError('Usage: python read_license_plate.py <path_to_image>')

try:
    image = cv2.imread(path)
except Exception:
    raise ValueError('Invalid path provided')

if image is None:
    raise ValueError('Invalid path provided')

resized_image = cv2.resize(image, (224, 224))
scaled_image = resized_image / 255

if DEFAULT_MODEL_PATH.exists():
    from keras.models import load_model

    # model to use
    model = load_model(DEFAULT_MODEL_PATH)

    y = model.predict(np.array([scaled_image]))
    xmin, ymin, xmax, ymax = y[0][0], y[0][1], y[0][2], y[0][3]
    xmin = int(xmin * image.shape[1])
    ymin = int(ymin * image.shape[0])
    xmax = int(xmax * image.shape[1])
    ymax = int(ymax * image.shape[0])

    modifier = 0
    a, b, c, d = int(ymin - image.shape[0] * modifier), int(ymax + image.shape[0] * modifier), int(xmin - image.shape[1] * modifier), int(xmax + image.shape[1] * modifier)
    sliced_image = image[a:b, c:d]
else:
    sliced_image = image

reader = Reader(
    ['en'],
    model_storage_directory=str(EASYOCR_MODEL_DIR),
    user_network_directory=str(EASYOCR_USER_NETWORK_DIR),
    gpu=False,
)
result = reader.readtext(sliced_image)
plate_candidates = assemble_plate_candidates(result)

for bbox, text, confidence in result:
    if format_plate(text):
        formatted = format_plate(text)
        plate_candidates.append((formatted, float(confidence) + region_bonus(formatted), bbox))

    if not is_plate_region(text, bbox):
        continue

    x1, y1, x2, y2 = crop_bounds(sliced_image.shape, bbox)
    crop = sliced_image[y1:y2, x1:x2]
    refined = read_plate_from_crop(reader, crop)
    if refined:
        formatted, refined_confidence = refined
        adjusted_bbox = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
        plate_candidates.append((formatted, refined_confidence + region_bonus(formatted), adjusted_bbox))

os.makedirs(OUTPUT_DIR, exist_ok=True)

cv2.imwrite(str(OUTPUT_DIR / 'sliced_result.png'), sliced_image)
if DEFAULT_MODEL_PATH.exists():
    cv2.imwrite(str(OUTPUT_DIR / 'rectangle_result.png'), cv2.rectangle(image, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2))
elif plate_candidates:
    best_plate, _, best_bbox = max(plate_candidates, key=lambda item: item[1])
    px1, py1, px2, py2 = bbox_bounds(best_bbox)
    annotated_image = cv2.rectangle(image.copy(), (px1, py1), (px2, py2), (0, 255, 0), 2)
    cv2.imwrite(str(OUTPUT_DIR / 'rectangle_result.png'), annotated_image)
else:
    cv2.imwrite(str(OUTPUT_DIR / 'rectangle_result.png'), image)


if plate_candidates:
    best_plate, _, _ = max(plate_candidates, key=lambda item: item[1])
    with open(OUTPUT_DIR / 'result.txt', 'w') as f:
        f.write(f'{best_plate}\n')
elif len(result) == 0:
    with open(OUTPUT_DIR / 'result.txt', 'w') as f:
        f.write('No text found')
else:
    with open(OUTPUT_DIR / 'result.txt', 'w') as f:
        f.write('No license plate found')
