"""
Sermon Coach corpus parsers.

Only instruments that survived two independent corpus reads.
See claude/claude_corpus-derivation.md for provenance and reference values.

Pure functions. Text in, numbers out. No network, no model API.
The one dependency is spaCy, used solely for I1 (Christ as grammatical subject).
"""

from __future__ import annotations

import re
import statistics
from dataclasses import dataclass, asdict, field

# ---------------------------------------------------------------- preprocessing

FOOTNOTE_LINK = re.compile(r"\[\*?[a-z0-9]{1,3}\*?\]\(https?://[^)]*\)", re.I)
MD_LINK = re.compile(r"\[([^\]]*)\]\(https?://[^)]*\)")
ESCAPED = re.compile(r"\\([.#*_\-!'\"()\[\]])")
VERSE_NUM = re.compile(r"__\s*\d+\s*__")
BOLD_ITAL = re.compile(r"[_*]{1,3}")
FOOTNOTE_MARK = re.compile(r"\*\d+\*|\*\d+(?=\s|$)")


ANCHOR_FOOTNOTE = re.compile(r'<a id="footnote-[^"]*"></a>')
FOOTNOTE_LIST = re.compile(
    r"\n\s*\d+\.\s*<a id=\"footnote-[^\n]*", re.M)
FOOTNOTE_REF = re.compile(r"\[\s*[↑^]\s*\]\(#footnote-ref-\d+\)")
# Logos/ESV list without the HTML wrapper (the Why_Community / plain-md form).
FOOTNOTE_PLAIN = re.compile(
    r"\n\s*\d+\.\s+(?:Greek |Or |ver\.|ch\.|See |Some manuscripts|"
    r"The Holy Bible)",
    re.M,
)
INLINE_FN = re.compile(r"\[\[[^\]]+\]\]\(#footnote-\d+\)")
MD_FOOTNOTE_DEF = re.compile(r"^\[\^\d+\]:.*$", re.M)
MD_FOOTNOTE_REF = re.compile(r"\[\^\d+\]")


def clean(text: str) -> str:
    """Strip ESV footnote apparatus and markdown noise. Order matters."""
    t = FOOTNOTE_LIST.sub("", text)
    t = FOOTNOTE_PLAIN.sub("", t)
    t = ANCHOR_FOOTNOTE.sub("", t)
    t = FOOTNOTE_REF.sub("", t)
    t = INLINE_FN.sub("", t)
    t = MD_FOOTNOTE_DEF.sub("", t)
    t = MD_FOOTNOTE_REF.sub("", t)
    t = FOOTNOTE_LINK.sub("", t)
    t = MD_LINK.sub(r"\1", t)
    t = VERSE_NUM.sub(" ", t)
    t = FOOTNOTE_MARK.sub("", t)
    t = ESCAPED.sub(r"\1", t)
    t = BOLD_ITAL.sub("", t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in parts if s.strip()]


# Printed-scripture detection: a paragraph is scripture if it originally
# carried verse numbers or dense ESV footnote links.
def scripture_paragraph_flags(raw_text: str) -> list[bool]:
    raw_paras = [p for p in re.split(r"\n\s*\n", raw_text) if p.strip()]
    flags = []
    for p in raw_paras:
        verses = len(VERSE_NUM.findall(p))
        notes = len(FOOTNOTE_LINK.findall(p))
        flags.append(verses >= 2 or notes >= 3)
    return flags


# ---------------------------------------------------------------- screens

# A byline sits on its own short line near the top. Mid-prose "played by
# Sylvester Stallone" is not a byline. Positional constraint required:
# the project's loose version both missed Ortlund four times and rejected
# a Rocky illustration once.
BYLINE = re.compile(
    r"^[^\n]{0,60}?\b(?:preached|delivered|written)\s+by\s+"
    r"(?:Rev\.?|Dr\.?|Pastor\s+)?[A-Z][a-z]+\s+[A-Z][a-z]+"
    r"[^\n]{0,40}$",
    re.M,
)
# Author block: a short line that is a plain personal name plus a church or
# date on the following line. This is what the Ortlund file looks like.
AUTHOR_BLOCK = re.compile(
    r"^\s*(?:Rev\.?|Dr\.?|Pastor)?\s*[A-Z][a-z]+\s+[A-Z][a-z]+(?:,?\s+Jr\.?)?\s*$"
    r"\n\s*[^\n]*(?:Church|Chapel|Cathedral|Fellowship|Ministries)[^\n]*$",
    re.M,
)
PREP_SLOT = re.compile(
    r"^\s*(ME|WE|GOD|YOU|TREASURE|LIVE|PROCLAIM|PROP|BIG IDEA|FCF)\s*:\s*$",
    re.M,
)
PLAN_MARKERS = re.compile(
    r"\b(teaching plan|sermon plan|series plan|preaching calendar|"
    r"\d+\s+sermons?\s*:)\b",
    re.I,
)


def screen(raw: str, cleaned: str) -> dict:
    """Contamination screens. Every one is a reject, not a warning."""
    words = len(cleaned.split())
    empty_slots = PREP_SLOT.findall(raw)
    return {
        "words": words,
        "too_short": words < 1200,
        "byline_hit": bool(BYLINE.search(raw[:1500]) or AUTHOR_BLOCK.search(raw[:1500])),
        "prep_doc": len(empty_slots) >= 2,
        "plan_doc": bool(PLAN_MARKERS.search(raw[:2000])),
        "empty_slots": len(empty_slots),
    }


def usable(s: dict) -> bool:
    """Stats-eligible: length filter plus contamination screens."""
    return not (s["too_short"] or s["byline_hit"] or s["prep_doc"] or s["plan_doc"])


def contaminated(s: dict) -> bool:
    return bool(s["byline_hit"] or s["prep_doc"] or s["plan_doc"])


# ---------------------------------------------------------------- source format
# Detect on flattening and intake path, never on absent outline markers.
# A prose manuscript without numbered points is still a manuscript.
# YouTube intake joins caption chunks on spaces, destroying line breaks.

def is_flattened(text: str) -> bool:
    if len(text) < 400:
        return False
    newlines = text.count("\n")
    return newlines <= 3 and (newlines / len(text)) < 0.002


def detect_source_format(raw: str, intake_path: str | None = None) -> str:
    if intake_path == "youtube":
        return "transcript"
    if is_flattened(raw):
        return "transcript"
    return "manuscript"


# ---------------------------------------------------------------- structure

PLACEHOLDER = re.compile(
    r"\b(Ills?|XXXX|STORY OF|ADD|PREACH GOSPEL|ILLUSTRATION|NEW PROP|TBD)\b"
)
CAPS_LABEL = re.compile(r"^\s*[A-Z][A-Z \-/&']{2,}:\s*$", re.M)


def trd(cleaned: str) -> int:
    """Terminal Residue Detector. Last 15% by word count. rho ~= -0.42 twice."""
    words = cleaned.split()
    if not words:
        return 0
    tail = " ".join(words[int(len(words) * 0.85):])
    score = 0
    tail_paras = paragraphs(tail)

    bare = [
        p for p in tail_paras
        if len(p.split()) <= 10 and not re.search(r"[.!?]\s*$", p)
    ]
    if len(bare) >= 2:
        score += 1
    if len(CAPS_LABEL.findall(tail)) >= 2:
        score += 1
    if tail_paras and not re.search(r"[.!?]['\"]?\s*$", tail_paras[-1]):
        score += 1
    if PLACEHOLDER.search(tail):
        score += 1
    if tail_paras and len(tail_paras[-1].split()) <= 6:
        score += 1
    return score


def l6(cleaned: str, script_flags: list[bool]) -> float:
    """Prose ratio of the last six non-scripture paragraphs. +0.30, +0.51."""
    paras = paragraphs(cleaned)
    keep = [p for i, p in enumerate(paras)
            if i >= len(script_flags) or not script_flags[i]]
    last = keep[-6:]
    if not last:
        return 0.0
    prose = [p for p in last
             if len(p.split()) > 10 and re.search(r"[.!?]['\"]?\s*$", p)]
    return len(prose) / len(last)


OUTLINE_LINE = re.compile(
    r"^\s*(?:\d+[.)]\s+|[IVX]+[.)]\s+|[A-Z][A-Z \-/&']{4,}\s*$)", re.M
)
STAGE_LABELS = {
    "INTRO", "PRAYER", "SERMON", "ESV", "FCF", "PROP", "CONCLUSION",
    "APPLICATION", "ILLUSTRATION", "CLOSE", "AMEN", "WELCOME", "DISMISS",
    "INSERT PICTURE", "STORY", "BIG IDEA",
}
FOOTNOTE_BODY = re.compile(
    r"^(?:Greek |Or |ver\.|ch\.|See |Some manuscripts|The Holy Bible)",
    re.I,
)
QUOTE_BODY = re.compile(r"^[\.…]{0,3}[\s]*[\"“‘'\«…]")


def outline_points(cleaned: str) -> list[str]:
    """Numbered / ALL-CAPS main and sub points, not quote catalogs or labels.

    Why_Community returned 56 because a 50-item 'one another' verse catalog
    is numbered. Those lines open with a quotation mark. Drop them.
    """
    out = []
    for line in cleaned.split("\n"):
        raw_line = line.strip()
        if not raw_line or len(raw_line.split()) > 20:
            continue
        label = raw_line.rstrip(":")
        if label in STAGE_LABELS:
            continue
        if not OUTLINE_LINE.match(line):
            continue
        body = re.sub(r"^(?:\d+[.)]\s+|[IVX]+[.)]\s+)", "", raw_line)
        if body != raw_line:
            if QUOTE_BODY.match(body) or FOOTNOTE_BODY.match(body):
                continue
        out.append(raw_line)
    return out


# ---------------------------------------------------------------- gospel

GOSPEL_WORDS = re.compile(
    r"\b(gospel|cross|crucifi|atone|redeem|redemption|propitiat|substitut|"
    r"resurrect|risen|saviour|savior|grace|justif|reconcil|ransom|blood of)\w*",
    re.I,
)
PASSION_DETAIL = re.compile(
    r"\b(nail|thorn|scourg|flog|spear|tomb|cross|golgotha|calvary|"
    r"pierc|whip|beaten|mock|crown of thorns|garden of gethsemane)\w*",
    re.I,
)


def outline_test(cleaned: str) -> dict:
    """Gospel word inside a numbered main point. 7:1 separation."""
    pts = outline_points(cleaned)
    hits = [p for p in pts if GOSPEL_WORDS.search(p)]
    return {
        "outline_points": len(pts),
        "outline_gospel_points": len(hits),
        "outline_test": bool(hits),
    }


# ---------------------------------------------------------------- ecclesial

RECIPROCAL = re.compile(
    r"\b(one another|each other|the body|your brother|your sister|"
    r"someone in (?:the|this) church|fellow (?:believer|member)s?|"
    r"the person next to you)\b",
    re.I,
)
IMPERATIVE_START = re.compile(
    r"(?:^|[.!?]\s+|\n)\s*((?:Go|Come|Give|Take|Make|Look|Listen|Stop|Start|"
    r"Pray|Serve|Love|Bear|Speak|Tell|Ask|Call|Write|Turn|Consider|Remember|"
    r"Trust|Believe|Rest|Confess|Forgive|Repent|Let|Do|Don't|Be|Seek|Hold|"
    r"Encourage|Welcome|Invite|Show|Bring)\b)"
)
CHURCH_WORDS = re.compile(
    r"\b(church|congregation|member|membership|elder|eldership|deacon|"
    r"pastor|overseer|baptism|baptize|communion|lord's supper|ordinance|"
    r"discipline|flock|body of christ|gather|assembly|fellowship|"
    r"saints|community group|small group|members' meeting|"
    r"our church|this church)\w*",
    re.I,
)


def ri(cleaned: str) -> int:
    """Reciprocal object within ~110 chars of an imperative, anywhere.
    Pooled r ~= +0.56. Note: anywhere, not the tail. The tail version lost."""
    hits = 0
    for m in IMPERATIVE_START.finditer(cleaned):
        window = cleaned[m.start(): m.start() + 110]
        if RECIPROCAL.search(window):
            hits += 1
    return hits


def edge_share(cleaned: str) -> float:
    """Church-word share in the first or last 12%. Chance 0.24; corpus 0.515."""
    words = cleaned.split()
    n = len(words)
    if n < 50:
        return 0.0
    positions = []
    idx = 0
    for w in words:
        if CHURCH_WORDS.search(w):
            positions.append(idx / n)
        idx += 1
    if not positions:
        return 0.0
    edge = [p for p in positions if p <= 0.12 or p >= 0.88]
    return len(edge) / len(positions)


# ---------------------------------------------------------------- application
# Interior / exterior rule frozen 26 August 2026. See brief-corpus-norms.md.
# The test is not the verb. It is whether the sermon supplied enough that
# someone could tell the command was obeyed.

INTERIOR_VERBS = {
    "remember", "consider", "behold", "look", "trust", "believe", "rest",
    "receive", "rejoice", "marvel", "treasure", "hope", "fear", "love",
    "repent", "humble", "examine", "know", "see", "realize", "understand",
    "meditate", "reflect", "delight", "long", "yearn", "cherish", "ponder",
}
EXTERIOR_VERBS = {
    "call", "write", "go", "give", "invite", "tell", "apologize", "serve",
    "attend", "hand", "sign", "show", "bring", "visit", "text", "email",
    "meet", "join", "volunteer", "donate", "return", "walk",
    # added 27 Aug from observed misclassifications in the corpus
    "come", "take", "listen", "read", "open", "set", "put", "write down",
    "get", "buy", "pick", "drive", "sit", "stand", "raise", "turn",
}
# Tie-breaker verbs: default interior, promoted to exterior on a named target.
CONDITIONAL = {"confess", "forgive", "pray", "stop", "speak", "share", "help"}

NAMED_TARGET = re.compile(
    r"\b(to|with|for)\s+(?:the\s+)?(?:person|people|man|woman|friend|"
    r"neighbou?r|spouse|husband|wife|son|daughter|brother|sister|"
    r"coworker|boss|elder|pastor|someone|him|her|them)\b",
    re.I,
)
NAMED_OCCASION = re.compile(
    r"\b(this week|tomorrow|tonight|today|by (?:friday|sunday|monday)|"
    r"at (?:breakfast|dinner|lunch)|before you (?:leave|go|sleep)|"
    r"this (?:morning|afternoon|evening|month)|on (?:monday|sunday))\b",
    re.I,
)
POSTURE_OBJECT = re.compile(
    r"\b(trying|striving|earning|worrying|pretending|comparing|"
    r"performing|hiding|proving)\b",
    re.I,
)


def classify_imperative(sentence: str) -> str | None:
    """Return 'interior', 'exterior', or None if not an imperative."""
    m = IMPERATIVE_START.search(" " + sentence)
    if not m:
        return None
    verb = m.group(1).lower().strip()
    has_target = bool(NAMED_TARGET.search(sentence))
    has_occasion = bool(NAMED_OCCASION.search(sentence))

    # Hybrid rule, restricted to the main clause. Cut at the first quotation
    # mark or subordinator so an exterior verb inside quoted scripture does
    # not promote the sentence. ("Remember Jesus' words as he commissioned
    # his disciples: go..." is interior, not exterior.)
    main = re.split(r"[\u201c\u2018\"']|\b(?:as|when|because|since|that|which|who|"
                    r"where|while|though|although|if)\b", sentence, maxsplit=1)[0]
    tokens = {w.strip(".,;:!?").lower() for w in main.split()}
    if tokens & EXTERIOR_VERBS:
        return "exterior"

    if verb in CONDITIONAL:
        if verb == "stop":
            # Stopping a named behavior is exterior; stopping a posture is not.
            return "interior" if POSTURE_OBJECT.search(sentence) else "exterior"
        return "exterior" if (has_target or has_occasion) else "interior"

    if verb in EXTERIOR_VERBS:
        return "exterior"
    if verb in INTERIOR_VERBS:
        return "interior"
    return "interior"  # frozen default: unlisted and ambiguous is interior


def imperative_ratio(cleaned: str, script_flags: list[bool]) -> dict:
    paras = paragraphs(cleaned)
    own = [p for i, p in enumerate(paras)
           if i >= len(script_flags) or not script_flags[i]]
    interior = exterior = 0
    for p in own:
        for s in sentences(p):
            c = classify_imperative(s)
            if c == "interior":
                interior += 1
            elif c == "exterior":
                exterior += 1
    ratio = interior / exterior if exterior else float("inf")
    return {
        "imp_interior": interior,
        "imp_exterior": exterior,
        "interior_exterior_ratio": round(ratio, 3) if exterior else None,
    }


DOMAIN_SPHERES = {
    "marriage": r"\b(marriage|spouse|husband|wife)\b",
    "parenting": r"\b(children|kids|parent|son|daughter)\b",
    "work": r"\b(job|work|career|boss|office|coworker)\b",
    "finances": r"\b(money|debt|budget|finances|paycheck|bills)\b",
    "singleness": r"\b(single|singleness|unmarried)\b",
    "health": r"\b(illness|sick|health|diagnosis|cancer)\b",
    "church": r"\b(church|congregation|small group|community group)\b",
}
QUANTITY = re.compile(
    r"\$\d|\b\d+\s*(minutes?|hours?|days?|weeks?|months?|dollars?|times?)\b", re.I
)


def application_markers(cleaned: str) -> dict:
    words = cleaned.split()
    tail = " ".join(words[int(len(words) * 0.80):])
    spheres = sum(1 for pat in DOMAIN_SPHERES.values()
                  if re.search(pat, tail, re.I))
    tail_sents = sentences(tail)
    final = tail_sents[-1] if tail_sents else ""
    if final.endswith("?"):
        ftype = "question"
    elif classify_imperative(final):
        ftype = "imperative"
    else:
        ftype = "declarative"
    lists = [len(re.findall(r"^\s*\d+[.)]", p, re.M)) for p in paragraphs(tail)]
    return {
        "domain_sweep": spheres >= 4,
        "domain_spheres": spheres,
        "quantity_present": bool(QUANTITY.search(tail)),
        "final_sentence_type": ftype,
        "longest_list": max(lists) if lists else 0,
    }


# ---------------------------------------------------------------- Christ agency

# Recovered from redemptive-movement C1 (pre-registration §1) and the
# span tables, not from hitting the 17-manuscript mean.
LOCI = {
    "creation": r"\b(creation|creator|created all things|garden of eden|"
                r"in the beginning|image of god|made the heaven|"
                r"made the world|genesis 1)\b",
    "fall": r"\b(the fall|adam(?:'s)? sin|eve in the garden|the curse|"
            r"genesis 3|sin entered|original sin|garden of eden)\b",
    "abraham": r"\b(abraham|abram|abrahamic|isaac|covenant with abraham|"
               r"seed of abraham|genesis 12)\b",
    "exodus": r"\b(exodus|red sea|passover|egypt|pharaoh|out of slavery|"
              r"wilderness)\b",
    "law": r"\b(the law|sinai|sacrific|levitic|tabernacle|temple|mosaic|"
           r"mount sinai|giving of the law)\w*\b",
    "david": r"\b(david|davidic|son of david|throne of david|"
             r"king of israel|root of david)\b",
    "exile": r"\b(exile|exiled|babylon|captivity|586)\b",
    "promise": r"\b(prophet|prophec|isaiah|jeremiah|ezekiel|foretold|"
               r"promised land|new covenant)\w*\b",
    "incarnation": r"\b(incarnation|bethlehem|born of|became flesh|"
                   r"came into the world|came to earth|christmas|virgin|"
                   r"came in the flesh)\b",
    "cross": r"\b(cross|crucifix|calvary|golgotha|died for|died in our|"
             r"blood of (?:christ|jesus)|atoning)\w*\b",
    "resurrection": r"\b(resurrect|risen|empty tomb|rose from|"
                    r"alive from the dead|easter)\w*\b",
    "ascension": r"\b(ascension|ascended|right hand of (?:the )?(?:father|"
                 r"god|the throne))\b",
    "pentecost": r"\b(pentecost|the church age|spirit was poured|"
                 r"priesthood of all believers|birth of the church)\b",
    "consummation": r"\b(second coming|return of christ|coming back|"
                    r"new heaven|consummation|final judgment|"
                    r"making all things new|eternal life)\b",
}

# Recovered from I1 / B1 (Christ-referring tokens) and the spine census
# names. Bare "Lord" and anaphoric "he" are not in the source lists.
CHRIST_TOKEN_WORDS = {
    "jesus", "christ", "messiah", "savior", "saviour", "redeemer",
    "immanuel", "emmanuel",
}
CHRIST_PHRASES = (
    "lord jesus",
    "son of god",
    "son of man",
    "lamb of god",
    "jesus christ",
    "christ jesus",
)
# Spine census is Jesus / Christ / Messiah only (4,227-point count).
SPINE_CHRIST = {"jesus", "christ", "messiah"}
COPULAR = {"be", "is", "was", "are", "were", "been", "being", "am"}


def locus_count(cleaned: str) -> dict:
    hits = [k for k, pat in LOCI.items() if re.search(pat, cleaned, re.I)]
    order = list(LOCI.keys())
    idx = sorted(order.index(h) for h in hits)
    return {
        "locus_count": len(hits),
        "locus_spread": (idx[-1] - idx[0]) if len(idx) >= 2 else 0,
    }


def _christ_token_match(tok, doc) -> bool:
    low = tok.text.lower()
    if low in CHRIST_TOKEN_WORDS:
        return True
    # "Son" in "Son of God / Son of Man"
    if low == "son" and tok.i + 2 < len(doc):
        nxt = f"{doc[tok.i + 1].text} {doc[tok.i + 2].text}".lower()
        if nxt in {"of god", "of man"}:
            return True
    if low == "lamb" and tok.i + 2 < len(doc):
        nxt = f"{doc[tok.i + 1].text} {doc[tok.i + 2].text}".lower()
        if nxt == "of god":
            return True
    return False


def christ_agency(cleaned: str, nlp) -> dict:
    """I1. Christ as nsubj of a non-copular finite verb, over all mentions.
    Reference: +0.925 and +0.903 against hand coding; kappa 1.000."""
    doc = nlp(cleaned[:900_000])
    subj = nonsubj = 0
    for tok in doc:
        if not _christ_token_match(tok, doc):
            continue
        head = tok.head
        if (tok.dep_ == "nsubj" and head.pos_ in {"VERB", "AUX"}
                and head.lemma_.lower() not in COPULAR):
            subj += 1
        else:
            nonsubj += 1
    total = subj + nonsubj
    return {
        "christ_mentions": total,
        "christ_subj": subj,
        "agency_share": round(subj / total, 4) if total else None,
        "christ_density_per_1k": round(
            total / max(len(cleaned.split()), 1) * 1000, 3),
    }


def spine_census(cleaned: str, nlp) -> dict:
    """Christ as grammatical subject of a finite action verb inside a
    numbered outline point. Corpus reference: 21 of 4,227 = 0.50%."""
    pts = outline_points(cleaned)
    naming = agent = 0
    for p in pts:
        if not re.search(r"\b(jesus|christ|messiah)\b", p, re.I):
            continue
        naming += 1
        d = nlp(p)
        for tok in d:
            if (tok.text.lower() in SPINE_CHRIST
                    and tok.dep_ == "nsubj"
                    and tok.head.pos_ in {"VERB", "AUX"}
                    and tok.head.lemma_.lower() not in COPULAR):
                agent += 1
                break
    return {"points_naming_christ": naming, "points_christ_agent": agent}


# ---------------------------------------------------------------- general

CAPS_RUN = re.compile(r"\b[A-Z]{3,}(?:\s+[A-Z]{2,})*\b")
CAPS_STAGE = {
    "INSERT PICTURE", "INSERT PIC", "DISMISS", "PASTOR PEOPLE", "WELCOME",
    "STORY", "STORY OF", "PRAYER", "CLOSE", "AMEN",
}
CAPS_STRUCTURAL = {
    "INTRO", "PROP", "FCF", "SERMON", "ESV", "ME", "WE", "GOD", "YOU",
    "TREASURE", "LIVE", "PROCLAIM", "BIG IDEA", "APPLICATION", "CONCLUSION",
    "ILLUSTRATION",
}
SECOND_PERSON = re.compile(r"\b(you|your|yours|yourself|yourselves)\b", re.I)
CROSSREF = re.compile(
    r"\b(?:[1-3]\s?)?(?:Gen|Ex|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kgs|Chr|Ezra|"
    r"Neh|Est|Job|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|"
    r"Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|Cor|"
    r"Gal|Eph|Phil|Col|Thess|Tim|Titus|Phlm|Heb|Jas|Pet|Jude|Rev)\w*\.?\s+\d+",
)


def general(cleaned: str, raw: str, script_flags: list[bool]) -> dict:
    words = cleaned.split()
    n = max(len(words), 1)
    sents = sentences(cleaned)
    lens = [len(s.split()) for s in sents if s.split()]
    paras = paragraphs(cleaned)
    script_words = sum(
        len(p.split()) for i, p in enumerate(paras)
        if i < len(script_flags) and script_flags[i]
    )
    caps = CAPS_RUN.findall(cleaned)
    caps_emph = []
    for c in caps:
        if c.endswith(":"):
            continue
        if c in CAPS_STAGE or c in CAPS_STRUCTURAL:
            continue
        # Exultation reads: long all-caps lines are stage directions.
        if len(c.split()) >= 6:
            continue
        caps_emph.append(c)
    return {
        "word_count": len(words),
        "median_sentence_len": statistics.median(lens) if lens else 0,
        "printed_scripture_share": round(script_words / n, 4),
        "second_person_per_1k": round(len(SECOND_PERSON.findall(cleaned)) / n * 1000, 2),
        "questions_per_1k": round(cleaned.count("?") / n * 1000, 2),
        "crossrefs_per_1k": round(len(CROSSREF.findall(cleaned)) / n * 1000, 2),
        "allcaps_per_1k": round(len(caps_emph) / n * 1000, 2),
        "passion_detail_per_1k": round(
            len(PASSION_DETAIL.findall(cleaned)) / n * 1000, 3),
        "churchword_per_1k": round(len(CHURCH_WORDS.findall(cleaned)) / n * 1000, 2),
    }


# ---------------------------------------------------------------- driver

def analyze(raw: str, nlp=None, intake_path: str | None = None) -> dict:
    cleaned = clean(raw)
    flags = scripture_paragraph_flags(raw)
    s = screen(raw, cleaned)
    source_format = detect_source_format(raw, intake_path)
    manuscript = source_format == "manuscript"
    out = {
        "screen": s,
        "source_format": source_format,
        "usable": usable(s),
        "collapse_eligible": manuscript and not contaminated(s),
    }
    # A3: collapse measures on every manuscript, including short ones.
    # Prep-diagnostic; they do not run on transcripts.
    if out["collapse_eligible"]:
        out["trd"] = trd(cleaned)
        out["l6"] = round(l6(cleaned, flags), 4)
    if contaminated(s):
        return out
    if not manuscript:
        # Preaching-lens instruments still run on transcripts when long enough.
        if not out["usable"]:
            return out
        out.update(general(cleaned, raw, flags))
        out["ri"] = ri(cleaned)
        out["edge_share"] = round(edge_share(cleaned), 4)
        out.update(imperative_ratio(cleaned, flags))
        out.update(application_markers(cleaned))
        out.update(locus_count(cleaned))
        if nlp is not None:
            out.update(christ_agency(cleaned, nlp))
        return out
    if not out["usable"]:
        return out
    out.update(general(cleaned, raw, flags))
    out.update(outline_test(cleaned))
    out["ri"] = ri(cleaned)
    out["edge_share"] = round(edge_share(cleaned), 4)
    out.update(imperative_ratio(cleaned, flags))
    out.update(application_markers(cleaned))
    out.update(locus_count(cleaned))
    if nlp is not None:
        out.update(christ_agency(cleaned, nlp))
        out.update(spine_census(cleaned, nlp))
    return out


def containment(a: str, b: str) -> float:
    """Content-word containment |A n B| / min(|A|,|B|). Re-preach collapse."""
    wa = {w.lower() for w in re.findall(r"[a-zA-Z]{4,}", a)}
    wb = {w.lower() for w in re.findall(r"[a-zA-Z]{4,}", b)}
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / min(len(wa), len(wb))
