import argparse
from pathlib import Path

from services.recognition.plate_ocr import PlateOcr


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
DEFAULT_FOLDER = Path(__file__).resolve().parents[1] / "pictures"


def iter_images(folder: Path) -> list[Path]:
    return sorted(path for path in folder.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run OCR on a folder of toll images.")
    parser.add_argument(
        "--folder",
        default=str(DEFAULT_FOLDER),
        help="Folder with images to process (default: speed_detection/pictures).",
    )
    parser.add_argument("--languages", default="en", help="Comma-separated OCR languages.")
    parser.add_argument("--gpu", action="store_true", help="Enable GPU if available.")
    args = parser.parse_args()

    folder = Path(args.folder)
    if not folder.exists():
        raise SystemExit(f"Folder does not exist: {folder}")

    languages = [item.strip() for item in args.languages.split(",") if item.strip()]
    ocr = PlateOcr(languages=languages or ["en"], gpu=args.gpu)

    for image_path in iter_images(folder):
        plate_text, _confidence, _candidates = ocr.read_plate(str(image_path))
        if plate_text:
            print(plate_text)


if __name__ == "__main__":
    main()
