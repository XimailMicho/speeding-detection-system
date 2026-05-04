import argparse
import re
from pathlib import Path

import easyocr
import cv2


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
DEFAULT_FOLDER = Path(__file__).resolve().parents[1] / "pictures"
PLATE_PATTERN = re.compile(r"^[A-Z]{2}\d{3,4}[A-Z]{2}$")
EXTRA_LETTER_PATTERN = re.compile(r"^([A-Z]{3,})(\d+)([A-Z]{2})$")
PREFIX_ONLY_PATTERN = re.compile(r"^[A-Z]{2}$")
DIGITS_SUFFIX_PATTERN = re.compile(r"^(\d{3,4}[A-Z]{2})$")


def iter_images(folder: Path) -> list[Path]:
    return sorted(path for path in folder.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS)


def normalize_text(text: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "", text or "")
    return cleaned.upper()


def bbox_left_x(bbox: list) -> float:
    return min(point[0] for point in bbox)


def read_image(path: Path) -> "cv2.Mat":
    image = cv2.imread(str(path))
    if image is None:
        raise RuntimeError(f"Failed to load image: {path}")
    return image


def ocr_left_prefix(reader: easyocr.Reader, image_path: Path, left_ratio: float) -> str:
    image = read_image(image_path)
    height, width = image.shape[:2]
    crop_width = max(1, int(width * left_ratio))
    left_crop = image[:, :crop_width]
    results = reader.readtext(left_crop, detail=1, paragraph=False)
    if not results:
        return ""

    best_prefix = ""
    best_confidence = -1.0
    for _bbox, text, confidence in results:
        normalized = normalize_text(text)
        if PREFIX_ONLY_PATTERN.fullmatch(normalized) and float(confidence) > best_confidence:
            best_confidence = float(confidence)
            best_prefix = normalized

    return best_prefix


def enforce_two_letter_prefix(text: str) -> str:
    match = EXTRA_LETTER_PATTERN.fullmatch(text)
    if not match:
        return text

    prefix, digits, suffix = match.groups()
    trimmed = f"{prefix[-2:]}{digits}{suffix}"
    return trimmed if PLATE_PATTERN.fullmatch(trimmed) else text


def has_letters_and_digits(text: str) -> bool:
    return bool(re.search(r"[A-Z]", text)) and bool(re.search(r"\d", text))


def pick_best_candidate(results: list[tuple]) -> str:
    best_text = ""
    best_score = (-1, -1, -1, -1.0)

    for _bbox, text, confidence in results:
        normalized = normalize_text(text)
        if not normalized:
            continue

        score = (
            2 if PLATE_PATTERN.fullmatch(normalized) else 0,
            1 if has_letters_and_digits(normalized) else 0,
            len(normalized),
            float(confidence),
        )
        if score > best_score:
            best_score = score
            best_text = normalized

    return best_text


def pick_best_prefix(results: list[tuple]) -> tuple[str, float | None]:
    best_prefix = ""
    best_confidence = -1.0
    best_left_x = None

    for bbox, text, confidence in results:
        normalized = normalize_text(text)
        if PREFIX_ONLY_PATTERN.fullmatch(normalized):
            left_x = bbox_left_x(bbox)
            if float(confidence) > best_confidence:
                best_confidence = float(confidence)
                best_prefix = normalized
                best_left_x = left_x

    return best_prefix, best_left_x


def pick_best_digits_suffix(results: list[tuple]) -> tuple[str, float | None]:
    best_tail = ""
    best_confidence = -1.0
    best_left_x = None

    for bbox, text, confidence in results:
        normalized = normalize_text(text)
        if DIGITS_SUFFIX_PATTERN.fullmatch(normalized):
            left_x = bbox_left_x(bbox)
            if float(confidence) > best_confidence:
                best_confidence = float(confidence)
                best_tail = normalized
                best_left_x = left_x

    return best_tail, best_left_x


def assemble_from_parts(results: list[tuple]) -> str:
    prefix, prefix_left_x = pick_best_prefix(results)
    tail, tail_left_x = pick_best_digits_suffix(results)
    if prefix and tail and prefix_left_x is not None and tail_left_x is not None:
        if prefix_left_x < tail_left_x:
            combined = f"{prefix}{tail}"
            if PLATE_PATTERN.fullmatch(combined):
                return combined
    return ""


def best_ocr_text(reader: easyocr.Reader, image_path: Path, left_crop_ratio: float, debug: bool) -> str:
    results = reader.readtext(str(image_path), detail=1, paragraph=False)
    if not results:
        return ""

    if debug:
        for bbox, text, confidence in results:
            normalized = normalize_text(text)
            left_x = bbox_left_x(bbox)
            print(f"DEBUG\t{image_path.name}\t{normalized}\t{confidence:.3f}\t{left_x:.1f}")

    assembled = assemble_from_parts(results)
    if assembled:
        return assembled

    normalized = pick_best_candidate(results)
    if DIGITS_SUFFIX_PATTERN.fullmatch(normalized):
        prefix, prefix_left_x = pick_best_prefix(results)
        if not prefix:
            prefix = ocr_left_prefix(reader, image_path, left_crop_ratio)
        if prefix:
            combined = f"{prefix}{normalized}"
            if PLATE_PATTERN.fullmatch(combined):
                return combined

    return enforce_two_letter_prefix(normalized)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run OCR on a folder of toll images.")
    parser.add_argument(
        "--folder",
        default=str(DEFAULT_FOLDER),
        help="Folder with images to process (default: speed_detection/pictures).",
    )
    parser.add_argument("--languages", default="en", help="Comma-separated OCR languages.")
    parser.add_argument("--gpu", action="store_true", help="Enable GPU if available.")
    parser.add_argument(
        "--left-crop-ratio",
        type=float,
        default=0.3,
        help="Ratio of image width to scan for the two-letter prefix (default: 0.3).",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print OCR candidates with confidence and left-most x position.",
    )
    args = parser.parse_args()

    folder = Path(args.folder)
    if not folder.exists():
        raise SystemExit(f"Folder does not exist: {folder}")

    languages = [item.strip() for item in args.languages.split(",") if item.strip()]
    reader = easyocr.Reader(list(languages or ["en"]), gpu=args.gpu)

    for image_path in iter_images(folder):
        plate_text = best_ocr_text(reader, image_path, args.left_crop_ratio, args.debug)
        print(f"{image_path.name}\t{plate_text}")


if __name__ == "__main__":
    main()
