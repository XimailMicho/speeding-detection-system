import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Tuple
import easyocr

@dataclass
class PlateCandidate:
    text: str
    confidence: float


class PlateOcr:
    def __init__(self, languages: Optional[Iterable[str]] = None, gpu: bool = False) -> None:
        # Lazy import so the module can be imported without OCR deps installed.


        self.reader = easyocr.Reader(list(languages or ["en"]), gpu=gpu)

    def read_plate(self, image_path: str) -> Tuple[str, Optional[float], List[PlateCandidate]]:
        results = self.reader.readtext(image_path, detail=1, paragraph=False)
        candidates: List[PlateCandidate] = []

        for _bbox, text, confidence in results:
            normalized = _normalize_plate(text)
            if _is_plate_like(normalized):
                candidates.append(PlateCandidate(text=normalized, confidence=float(confidence)))

        if candidates:
            best = max(candidates, key=lambda item: item.confidence)
            return best.text, best.confidence, candidates

        # Fallback: pick the best raw OCR if nothing looked like a plate.
        if results:
            _bbox, text, confidence = max(results, key=lambda item: item[2])
            return _normalize_plate(text), float(confidence), []

        return "", None, []


def _normalize_plate(text: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "", text or "")
    return cleaned.upper()


def _is_plate_like(text: str) -> bool:
    if not text:
        return False
    if len(text) < 4 or len(text) > 12:
        return False
    return text.isalnum()

