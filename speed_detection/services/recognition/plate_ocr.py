import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Tuple
import easyocr


@dataclass
class PlateCandidate:
    text: str
    confidence: float


@dataclass
class OcrToken:
    text: str
    confidence: float
    center_x: float


class PlateOcr:
    def __init__(self, languages: Optional[Iterable[str]] = None, gpu: bool = False) -> None:
        self.reader = easyocr.Reader(list(languages or ["en"]), gpu=gpu)

    def read_plate(self, image_path: str) -> Tuple[str, Optional[float], List[PlateCandidate]]:
        results = self.reader.readtext(
            image_path,
            detail=1,
            paragraph=False,
            allowlist=PLATE_ALLOWLIST,
        )
        tokens: List[OcrToken] = []
        candidates: List[PlateCandidate] = []

        for bbox, text, confidence in results:
            normalized = _normalize_plate(text)
            if not normalized:
                continue
            token = OcrToken(
                text=normalized,
                confidence=float(confidence),
                center_x=_bbox_center_x(bbox),
            )
            tokens.append(token)
            for candidate in _extract_plate_candidates(normalized):
                candidates.append(PlateCandidate(text=candidate, confidence=token.confidence))

        if tokens:
            tokens.sort(key=lambda item: item.center_x)
            for merged in _merge_tokens(tokens):
                for candidate in _extract_plate_candidates(merged.text):
                    candidates.append(PlateCandidate(text=candidate, confidence=merged.confidence))
            candidates.extend(_build_plate_candidates(tokens))

        if candidates:
            filtered = [item for item in candidates if _has_valid_prefix(item.text)]
            pool = filtered or candidates
            best = max(pool, key=lambda item: item.confidence)
            return best.text, best.confidence, candidates

        return "", None, []


PLATE_ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
_VALID_PREFIXES = {
    "BE", "BT", "DB", "DE", "DH", "DK", "GE", "GV", "KA", "KI", "KO", "KP",
    "KR", "KU", "NE", "OH", "PP", "PE", "PS", "RA", "RE", "SK", "SN", "SR",
    "ST", "SU", "TE", "VE", "VI", "VV",
}
_PLATE_PATTERN = re.compile(r"[A-Z]{2}\d{4}[A-Z]{2}")
_STRICT_MIXED_5 = re.compile(r"^[A-Z]{2}\d{5}[A-Z]{2}$")
_DIGITS_SUFFIX = re.compile(r"^\d{4}[A-Z]{2}$")
_PREFIX_DIGITS = re.compile(r"^[A-Z]{2}\d{4}$")
_DIGITS_ONLY = re.compile(r"^\d{4,6}$")


def _normalize_plate(text: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "", text or "")
    return cleaned.upper()


def _extract_plate_candidates(text: str) -> List[str]:
    if not text:
        return []
    return [match.group(0) for match in _PLATE_PATTERN.finditer(text)]


def _has_valid_prefix(text: str) -> bool:
    return text[:2] in _VALID_PREFIXES


def _build_plate_candidates(tokens: List[OcrToken]) -> List[PlateCandidate]:
    candidates: List[PlateCandidate] = []
    prefixes = [t for t in tokens if len(t.text) == 2 and t.text.isalpha() and t.text in _VALID_PREFIXES]
    suffixes = [t for t in tokens if len(t.text) == 2 and t.text.isalpha()]

    for token in tokens:
        text = token.text
        if _STRICT_MIXED_5.match(text):
            prefix = text[:2]
            digits = text[2:7][-4:]
            suffix = text[-2:]
            candidates.append(PlateCandidate(text=f"{prefix}{digits}{suffix}", confidence=token.confidence))
        if _DIGITS_SUFFIX.match(text):
            prefix = _nearest_prefix_left(prefixes, token.center_x)
            if prefix:
                candidates.append(PlateCandidate(text=f"{prefix}{text}", confidence=token.confidence))
        if _PREFIX_DIGITS.match(text):
            suffix = _nearest_suffix_right(suffixes, token.center_x)
            if suffix:
                candidates.append(PlateCandidate(text=f"{text}{suffix}", confidence=token.confidence))
        if _DIGITS_ONLY.match(text):
            digits = text[-4:]
            prefix = _nearest_prefix_left(prefixes, token.center_x)
            suffix = _nearest_suffix_right(suffixes, token.center_x)
            if prefix and suffix:
                candidates.append(PlateCandidate(text=f"{prefix}{digits}{suffix}", confidence=token.confidence))

    return candidates


def _nearest_prefix_left(prefixes: List[OcrToken], center_x: float) -> str:
    left = [t for t in prefixes if t.center_x <= center_x]
    if not left:
        return ""
    return max(left, key=lambda t: t.center_x).text


def _nearest_suffix_right(suffixes: List[OcrToken], center_x: float) -> str:
    right = [t for t in suffixes if t.center_x >= center_x]
    if not right:
        return ""
    return min(right, key=lambda t: t.center_x).text


def _bbox_center_x(bbox) -> float:
    xs = [point[0] for point in bbox]
    return sum(xs) / len(xs)


def _merge_tokens(tokens: List[OcrToken]) -> List[PlateCandidate]:
    merged: List[PlateCandidate] = []
    max_window = min(6, len(tokens))
    for start in range(len(tokens)):
        for size in range(2, max_window + 1):
            end = start + size
            if end > len(tokens):
                continue
            chunk = tokens[start:end]
            text = "".join(item.text for item in chunk)
            confidence = min(item.confidence for item in chunk)
            merged.append(PlateCandidate(text=text, confidence=confidence))
    return merged
