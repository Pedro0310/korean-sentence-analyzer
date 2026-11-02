"""Turn the 한국어기초사전 XML dump into public/data/dictionary.json.

Usage: python scripts/build_dictionary.py [folder with the dictionary XML files]

Default folder: data/krdict-xml (git-ignored). The dump is the 2019-08-02 one the
flashcard vocabulary was built from; see README.md for where to get it.

Output: {headword: [[en, pos, enDefinition], ...]}, senses in dictionary order,
homographs one after the other. Spaces, ^ and - are removed from the key so
phrases (고속 도로) and affixes (-들) match how Kiwi writes them.
"""

import html
import io
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "dictionary.json"

# Same labels as the flashcard vocabulary (korean-flashcards/scripts/build-vocabulary.ts).
POS_LABEL = {
    "명사": "noun",
    "대명사": "pronoun",
    "수사": "numeral",
    "동사": "verb",
    "형용사": "adjective",
    "관형사": "determiner",
    "부사": "adverb",
    "감탄사": "interjection",
    "의존 명사": "bound noun",
    "보조 동사": "auxiliary verb",
    "보조 형용사": "auxiliary adjective",
    "조사": "particle",
    "어미": "ending",
    "접사": "affix",
}

MAX_SENSES = 4  # per entry; later senses are rare uses
# Homographs are listed common first: 먹다 "eat" (초급) before 먹다 "go deaf" (no level).
LEVEL_ORDER = {"초급": 0, "중급": 1, "고급": 2}
# For these the English "equivalent" is just a romanization (라도 -> "rado"); the definition says what it does.
GRAMMATICAL = {"particle", "ending", "affix", "expression"}


def readable(path: Path) -> io.BytesIO:
    """The dump has a few raw < > inside attribute values (30000.xml); escape them."""
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'val="([^"]*)"', lambda m: 'val="' + m[1].replace("<", "&lt;").replace(">", "&gt;") + '"', text)
    return io.BytesIO(text.encode("utf-8"))


def feats(element: ET.Element) -> dict[str, str]:
    # Values are escaped twice in the source (&amp;quot;); ElementTree undoes one level.
    return {f.get("att"): html.unescape(f.get("val", "")).strip() for f in element.findall("feat")}


def main() -> None:
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "data" / "krdict-xml").resolve()
    files = sorted(folder.glob("*.xml"), key=lambda p: int(p.stem) if p.stem.isdigit() else 0)
    if not files:
        sys.exit(f"No .xml files in {folder}")

    found: dict[str, list[tuple[int, int, list[list[str | None]]]]] = {}
    units: Counter[str] = Counter()
    entries = 0
    for path in files:
        for _, element in ET.iterparse(readable(path), events=("end",)):
            if element.tag != "LexicalEntry":
                continue
            entries += 1
            info = feats(element)
            lemma = element.find("Lemma")
            word = feats(lemma).get("writtenForm", "") if lemma is not None else ""
            units[info.get("lexicalUnit", "")] += 1
            # Grammar expressions (-잖아, -ㄹ 수 있다) have no part of speech.
            pos = "expression" if info.get("lexicalUnit") == "문법‧표현" else POS_LABEL.get(info.get("partOfSpeech", ""))
            key = word.replace(" ", "").replace("^", "").replace("-", "")
            senses = []
            for sense in element.findall("Sense")[:MAX_SENSES]:
                en = definition = ""
                for equivalent in sense.findall("Equivalent"):
                    e = feats(equivalent)
                    if e.get("language") == "영어":
                        en, definition = e.get("lemma", ""), e.get("definition", "")
                # A few senses only have a definition; it stands in for the missing equivalent.
                if pos in GRAMMATICAL and definition:
                    en = definition
                if en or definition:
                    senses.append([en or definition, pos, definition or None])
            if key and senses:
                rank = LEVEL_ORDER.get(info.get("vocabularyLevel", ""), 3)
                found.setdefault(key, []).append((rank, int(info.get("homonym_number") or 0), senses))
            element.clear()
        print(f"read {path.name}")

    dictionary: dict[str, list[list[str | None]]] = {}
    for key, homographs in found.items():
        seen: set[str] = set()
        for _, _, senses in sorted(homographs, key=lambda h: h[:2]):
            for sense in senses:
                if sense[0] not in seen:
                    seen.add(sense[0])
                    dictionary.setdefault(key, []).append(sense)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(dictionary, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{entries} entries ({dict(units)}) -> {len(dictionary)} headwords in {OUT.relative_to(ROOT)}")
    print(f"{OUT.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
