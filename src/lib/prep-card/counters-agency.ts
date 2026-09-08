/**
 * Theme 2 C1 / C2 — Christ as grammatical subject of a non-copular
 * action verb. UDPipe dependency parse (see udpipe.ts for calibration).
 *
 * Mirrors scripts/sermon_parsers.py christ_agency / spine_census.
 */

import { quotableMainPoints } from "./counters-frame";
import {
  getUdpipe,
  parseWithOffsets,
  type UdpipeWord,
} from "./udpipe";
import { cleanSermonText, detectPrepSourceFormat } from "./text";

const CHRIST_TOKEN_WORDS = new Set([
  "jesus",
  "christ",
  "messiah",
  "savior",
  "saviour",
  "redeemer",
  "immanuel",
  "emmanuel",
]);

const COPULAR = new Set([
  "be",
  "is",
  "was",
  "are",
  "were",
  "been",
  "being",
  "am",
]);

/** Prep measure id for Theme 2 C1 (agency in prose). */
export const CHRIST_C1_MEASURE_ID = 1 as const;
/** Prep measure id for Theme 2 C2 (agency in a main point). */
export const CHRIST_C2_MEASURE_ID = 6 as const;

export type ChristMentionLabel = {
  start: number | null;
  end: number | null;
  text: string;
  agent: boolean;
  /** Contiguous sentence text containing the mention (for evidence). */
  sentence: string;
};

export type ChristAgencyResult = {
  christMentions: number;
  christSubj: number;
  agencyShare: number | null;
  mentions: ChristMentionLabel[];
};

function isChristToken(
  form: string,
  next1: string | undefined,
  next2: string | undefined,
): boolean {
  const low = form.toLowerCase();
  if (CHRIST_TOKEN_WORDS.has(low)) {
    return true;
  }
  if (low === "son" && next1 && next2) {
    const nxt = `${next1} ${next2}`.toLowerCase();
    if (nxt === "of god" || nxt === "of man") {
      return true;
    }
  }
  if (low === "lamb" && next1 && next2) {
    const nxt = `${next1} ${next2}`.toLowerCase();
    if (nxt === "of god") {
      return true;
    }
  }
  return false;
}

function isAgentNsubj(word: UdpipeWord, head: UdpipeWord | undefined): boolean {
  if (!head) {
    return false;
  }
  if (word.deprel !== "nsubj") {
    return false;
  }
  if (head.upos !== "VERB" && head.upos !== "AUX") {
    return false;
  }
  const lemma = (head.lemma ?? "").toLowerCase();
  const form = (head.form ?? "").toLowerCase();
  if (COPULAR.has(lemma) || COPULAR.has(form)) {
    return false;
  }
  return true;
}

function sentenceText(words: UdpipeWord[], fallback: string): string {
  if (words.length === 0) {
    return fallback;
  }
  let out = "";
  for (let i = 0; i < words.length; i++) {
    const w = words[i]!;
    out += w.form;
    const spaceAfter =
      w.misc?.includes("SpaceAfter=No") === true
        ? false
        : i < words.length - 1;
    if (spaceAfter) {
      out += " ";
    }
  }
  return out.trim() || fallback;
}

/**
 * C1 detail: every Christ-referring token, whether it is nsubj of a
 * non-copular VERB/AUX, and the sentence for evidence.
 */
export async function christAgencyDetail(
  raw: string,
): Promise<ChristAgencyResult> {
  const cleaned = cleanSermonText(raw);
  const nlp = await getUdpipe();
  const parsed = parseWithOffsets(nlp, cleaned);
  const mentions: ChristMentionLabel[] = [];

  for (const { words } of parsed) {
    const byId = new Map(words.map((w) => [w.id, w] as const));
    const sent = sentenceText(words, "");
    for (let i = 0; i < words.length; i++) {
      const w = words[i]!;
      const next1 = words[i + 1]?.form;
      const next2 = words[i + 2]?.form;
      if (!isChristToken(w.form, next1, next2)) {
        continue;
      }
      const head = byId.get(w.head);
      mentions.push({
        start: w.start,
        end: w.end,
        text: w.form,
        agent: isAgentNsubj(w, head),
        sentence: sent,
      });
    }
  }

  const christMentions = mentions.length;
  const christSubj = mentions.filter((m) => m.agent).length;
  return {
    christMentions,
    christSubj,
    agencyShare:
      christMentions > 0 ? christSubj / christMentions : null,
    mentions,
  };
}

/**
 * C1: true when at least one Christ mention is nsubj of a non-copular
 * action verb. Always defined on non-empty cleaned text (false if no
 * Christ mentions or none are agents).
 */
export async function measureChristAgencyInProse(
  raw: string,
): Promise<boolean> {
  const detail = await christAgencyDetail(raw);
  return detail.christSubj > 0;
}

export type ChristPointAgency = {
  /** Numbered/quotable points that name Jesus/Christ/Messiah. */
  pointsNamingChrist: number;
  /** Those points where Christ is nsubj of a non-copular action verb. */
  pointsChristAgent: number;
  agentPoints: string[];
  namingNonAgentPoints: string[];
};

/**
 * C2 / measure 6: Christ as agent inside a quotable main point.
 * Manuscript-only; transcripts return null.
 */
export async function christAgencyInPointsDetail(
  raw: string,
  intakePath?: string | null,
): Promise<ChristPointAgency | null> {
  if (detectPrepSourceFormat(raw, intakePath) !== "manuscript") {
    return null;
  }
  const cleaned = cleanSermonText(raw);
  const points = quotableMainPoints(cleaned);
  if (points.length === 0) {
    return {
      pointsNamingChrist: 0,
      pointsChristAgent: 0,
      agentPoints: [],
      namingNonAgentPoints: [],
    };
  }

  const nlp = await getUdpipe();
  let naming = 0;
  let agent = 0;
  const agentPoints: string[] = [];
  const namingNonAgentPoints: string[] = [];

  for (const point of points) {
    if (!/\b(jesus|christ|messiah)\b/i.test(point)) {
      continue;
    }
    naming += 1;
    const parsed = parseWithOffsets(nlp, point);
    let hit = false;
    for (const { words } of parsed) {
      const byId = new Map(words.map((w) => [w.id, w] as const));
      for (let i = 0; i < words.length; i++) {
        const w = words[i]!;
        const low = w.form.toLowerCase();
        if (low !== "jesus" && low !== "christ" && low !== "messiah") {
          continue;
        }
        if (isAgentNsubj(w, byId.get(w.head))) {
          hit = true;
          break;
        }
      }
      if (hit) {
        break;
      }
    }
    if (hit) {
      agent += 1;
      agentPoints.push(point);
    } else {
      namingNonAgentPoints.push(point);
    }
  }

  return {
    pointsNamingChrist: naming,
    pointsChristAgent: agent,
    agentPoints,
    namingNonAgentPoints,
  };
}

/**
 * C2: true when any quotable main point has Christ as agent.
 * Manuscript-only; null on transcripts.
 */
export async function measureChristAgencyInPoint(
  raw: string,
  intakePath?: string | null,
): Promise<boolean | null> {
  const detail = await christAgencyInPointsDetail(raw, intakePath);
  if (detail == null) {
    return null;
  }
  return detail.pointsChristAgent > 0;
}

/** Alias used by the prep-card measure-6 slot. */
export async function measure6ChristInPoint(
  raw: string,
  intakePath?: string | null,
): Promise<boolean | null> {
  return measureChristAgencyInPoint(raw, intakePath);
}
