#!/usr/bin/env python3
"""Part B re-validation of sermon_parsers.py on Chris's 17 manuscripts.

Not a production norms run. Reads local manuscript files only.
"""

from __future__ import annotations

import json
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from sermon_parsers import (  # noqa: E402
    analyze,
    clean,
    outline_points,
)

LIB = Path(
    "/Users/cdaukas/Desktop/Sermon MD/Cleaned Library/Sunday Messages"
)

# Same 17 usable + the two short manuscripts A3 exists to keep.
SAMPLE = {
    "wisdom": [
        LIB / "Ecclesiastes/Ecclesiastes 1-12-18.md",
        LIB / "Ecclesiastes/Ecclesiastes 2-12-26.md",
        LIB / "Ecclesiastes/Ecclesiastes 3-1-15/Ecclesiastes 3-1-15.md",
        LIB / "Ecclesiastes/Ecclesiastes 5-8-20/Ecclesiastes 5-8-20.md",
        LIB / "Ecclesiastes/Ecclesiastes 12.md",
        LIB / "Psalm 67.md",
    ],
    "Acts": [
        LIB / "Acts - God on the Move/Acts 18-1-28.md",
        LIB / "Acts - God on the Move/Acts 19.md",
        LIB / "Acts - God on the Move/Acts 20-17-24.md",
        LIB / "Acts - God on the Move/Why Community? .md",
    ],
    "OT narrative": [
        LIB / "1 Samuel/1 Samuel 2-1-11.md",
        LIB / "Jonah/Jonah 3.md",
        LIB / "Jonah/Jonah 4.md",
    ],
    "epistle": [
        # Root 1 Timothy 6-11-16.md is a 161-word scripture stub.
        # Original Part B used the full manuscript.
        LIB / "1 Timothy/1 Timothy 6-11-16 final/1 Timothy 6-11-16 final.md",
        LIB / "Romans/romans 8-31-39.md",
    ],
    "prophecy": [
        LIB / "Isaiah 40/Isaiah 40.md",
    ],
    "apocalyptic": [
        LIB / "Revelation 3-7-13.md",
    ],
}

SHORT = [
    LIB / "Ecclesiastes/Ecclesiastes 4-4-16.md",
    LIB / "Acts - God on the Move/Acts 20-17-38.md",
]

WHY = LIB / "Acts - God on the Move/Why Community? .md"

REFERENCE = {
    "median_sentence_len": (12.4, 13.7),
    "edge_share": 0.515,
    "allcaps_per_1k": 11.9,
    "agency_share": 0.176,
    "christ_density_per_1k": (7.16, 8.92),
    "locus_count": 5.41,
    "locus_spread": (9.8, 10.1),
    "interior_exterior_ratio": 1.61,
}


def load_nlp():
    try:
        import spacy
    except ImportError:
        print("spaCy not installed; I1 and spine skipped.", file=sys.stderr)
        return None
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        print("en_core_web_sm not downloaded; I1 and spine skipped.", file=sys.stderr)
        return None


def mean(xs):
    xs = [x for x in xs if x is not None]
    return statistics.mean(xs) if xs else None


def median(xs):
    xs = [x for x in xs if x is not None]
    return statistics.median(xs) if xs else None


def main() -> int:
    nlp = load_nlp()
    rows = []
    missing = []
    for genre, paths in SAMPLE.items():
        for path in paths:
            if not path.exists():
                missing.append(str(path))
                continue
            raw = path.read_text(encoding="utf-8", errors="replace")
            result = analyze(raw, nlp=nlp)
            result["_file"] = path.name
            result["_genre"] = genre
            result["_path"] = str(path)
            rows.append(result)

    if missing:
        print("MISSING FILES:")
        for m in missing:
            print(" ", m)
        return 1

    short_rows = []
    for path in SHORT:
        raw = path.read_text(encoding="utf-8", errors="replace")
        result = analyze(raw, nlp=nlp)
        result["_file"] = path.name
        short_rows.append(result)

    why_raw = WHY.read_text(encoding="utf-8", errors="replace")
    why_pts = outline_points(clean(why_raw))

    usable_rows = [r for r in rows if r.get("usable")]
    stats = {
        "n_sample": len(rows),
        "n_usable": len(usable_rows),
        "dropped": [
            {
                "file": r["_file"],
                "words": r["screen"]["words"],
                "too_short": r["screen"]["too_short"],
                "byline_hit": r["screen"]["byline_hit"],
                "prep_doc": r["screen"]["prep_doc"],
                "plan_doc": r["screen"]["plan_doc"],
            }
            for r in rows
            if not r.get("usable")
        ],
        "why_community_outline_points": len(why_pts),
        "why_community_points": why_pts,
        "source_format": {
            "manuscript": sum(1 for r in rows if r.get("source_format") == "manuscript"),
            "transcript": sum(1 for r in rows if r.get("source_format") == "transcript"),
        },
        "instruments": {
            "median_sentence_len": mean(
                [r.get("median_sentence_len") for r in usable_rows]
            ),
            "edge_share": mean([r.get("edge_share") for r in usable_rows]),
            "allcaps_per_1k": mean([r.get("allcaps_per_1k") for r in usable_rows]),
            "agency_share": mean([r.get("agency_share") for r in usable_rows]),
            "christ_density_per_1k": mean(
                [r.get("christ_density_per_1k") for r in usable_rows]
            ),
            "locus_count": mean([r.get("locus_count") for r in usable_rows]),
            "locus_spread": mean([r.get("locus_spread") for r in usable_rows]),
            "interior_exterior_ratio": median(
                [r.get("interior_exterior_ratio") for r in usable_rows]
            ),
            "trd_fire_usable": sum(
                1 for r in usable_rows if (r.get("trd") or 0) >= 1
            ),
            "ri_fire_usable": sum(1 for r in usable_rows if (r.get("ri") or 0) >= 1),
            "outline_test_fire": sum(
                1 for r in usable_rows if r.get("outline_test")
            ),
        },
        "christ_density_by_genre": {},
        "short_collapse": [
            {
                "file": r["_file"],
                "words": r["screen"]["words"],
                "too_short": r["screen"]["too_short"],
                "usable": r["usable"],
                "collapse_eligible": r["collapse_eligible"],
                "trd": r.get("trd"),
                "l6": r.get("l6"),
                "source_format": r.get("source_format"),
            }
            for r in short_rows
        ],
    }
    for genre in SAMPLE:
        dens = [
            r.get("christ_density_per_1k")
            for r in usable_rows
            if r["_genre"] == genre and r.get("christ_density_per_1k") is not None
        ]
        stats["christ_density_by_genre"][genre] = {
            "n": len(dens),
            "mean": round(mean(dens), 3) if dens else None,
        }

    # Idempotence
    twice = analyze(why_raw, nlp=nlp)
    twice2 = analyze(why_raw, nlp=nlp)
    stats["idempotent"] = twice == twice2

    # Spine on the 17 (sample; the known rates are a census, not this sample)
    naming = sum(r.get("points_naming_christ") or 0 for r in usable_rows)
    agent = sum(r.get("points_christ_agent") or 0 for r in usable_rows)
    points = sum(r.get("outline_points") or 0 for r in usable_rows)
    stats["spine_on_17"] = {
        "outline_points": points,
        "naming": naming,
        "agent": agent,
        "naming_share": round(naming / points, 4) if points else None,
        "agent_share": round(agent / points, 4) if points else None,
    }

    # Spine rates ≈0.50% / ≈6.9% are a 4,227-point census of 497 manuscripts,
    # not a property of this 17. Not run here: Part B is the 17; Part C is off.

    stats["per_file"] = [
        {
            "file": r["_file"],
            "genre": r["_genre"],
            "usable": r["usable"],
            "words": r["screen"]["words"],
            "source_format": r["source_format"],
            "trd": r.get("trd"),
            "l6": r.get("l6"),
            "outline_points": r.get("outline_points"),
            "outline_test": r.get("outline_test"),
            "christ_density_per_1k": r.get("christ_density_per_1k"),
            "agency_share": r.get("agency_share"),
            "locus_count": r.get("locus_count"),
            "locus_spread": r.get("locus_spread"),
            "allcaps_per_1k": r.get("allcaps_per_1k"),
            "edge_share": r.get("edge_share"),
            "interior_exterior_ratio": r.get("interior_exterior_ratio"),
            "points_naming_christ": r.get("points_naming_christ"),
            "points_christ_agent": r.get("points_christ_agent"),
        }
        for r in rows
    ]

    out_path = ROOT / "claude" / "norms-part-b-revalidation.json"
    out_path.write_text(json.dumps(stats, indent=2, default=str) + "\n")
    print(json.dumps(stats, indent=2, default=str))
    print(f"\nWrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
