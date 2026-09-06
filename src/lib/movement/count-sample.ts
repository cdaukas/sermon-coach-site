/**
 * Count prep measures on an arbitrary sermon set (baseline or comparison).
 * Reuses the prep-card counters; does not rank or rewrite.
 */

import { measure12AddressesNonChristian } from "@/lib/prep-card/counters-address";
import {
  christAgencyDetail,
  measure6ChristInPoint,
} from "@/lib/prep-card/counters-agency";
import {
  codeCrossNamedObjects,
  measureGospelInSkeleton,
} from "@/lib/prep-card/counters-christ";
import { codeApplicationAsks } from "@/lib/prep-card/counters-coding";
import { measure5OutlineHomogeneous } from "@/lib/prep-card/counters-frame";
import { codeLocalNamings } from "@/lib/prep-card/counters-naming";
import {
  measure4ConclusionFinished,
  measure7HasReciprocalAsk,
} from "@/lib/prep-card/counters-parser";
import type { PrepMeasureId } from "@/lib/prep-card/measures";
import type { PrepSermonInput } from "@/lib/prep-card/build";
import type { MovementCount } from "./types";

export async function countMeasuresOnSample(
  sermons: PrepSermonInput[],
  measureIds: PrepMeasureId[],
  options?: { apiKey?: string; model?: string },
): Promise<MovementCount[]> {
  const need = new Set(measureIds);
  const needsAsk = [...need].some((id) => id === 2 || id === 3);
  const needsNaming = need.has(9);
  const needsCross = need.has(8);

  let m1Hits = 0;
  let m1Eligible = 0;
  let m4Hits = 0;
  let m4Eligible = 0;
  let m5Hits = 0;
  let m5Eligible = 0;
  let m6Hits = 0;
  let m6Eligible = 0;
  let m7Hits = 0;
  let m11Hits = 0;
  let m11Eligible = 0;
  let m12Hits = 0;

  for (const sermon of sermons) {
    if (need.has(1)) {
      const agency = await christAgencyDetail(sermon.content);
      m1Hits += agency.christSubj;
      m1Eligible += agency.christMentions;
    }
    if (need.has(4)) {
      const finished = measure4ConclusionFinished(
        sermon.content,
        sermon.intakePath,
      );
      if (finished != null) {
        m4Eligible += 1;
        if (finished) {
          m4Hits += 1;
        }
      }
    }
    if (need.has(5)) {
      const homogeneous = measure5OutlineHomogeneous(
        sermon.content,
        sermon.intakePath,
      );
      if (homogeneous != null) {
        m5Eligible += 1;
        if (homogeneous) {
          m5Hits += 1;
        }
      }
    }
    if (need.has(6)) {
      const point = await measure6ChristInPoint(
        sermon.content,
        sermon.intakePath,
      );
      if (point != null) {
        m6Eligible += 1;
        if (point) {
          m6Hits += 1;
        }
      }
    }
    if (need.has(7) && measure7HasReciprocalAsk(sermon.content)) {
      m7Hits += 1;
    }
    if (need.has(11)) {
      const gospel = measureGospelInSkeleton(
        sermon.content,
        sermon.intakePath,
      );
      if (gospel != null) {
        m11Eligible += 1;
        if (gospel) {
          m11Hits += 1;
        }
      }
    }
    if (need.has(12) && measure12AddressesNonChristian(sermon.content)) {
      m12Hits += 1;
    }
  }

  const codingOpts = { apiKey: options?.apiKey, model: options?.model };
  const codingInputs = sermons.map((sermon) => ({
    id: sermon.id,
    title: sermon.title,
    raw: sermon.content,
  }));

  let m2Hits = 0;
  let m3Hits = 0;
  let m8Hits = 0;
  let m9Hits = 0;
  if (needsAsk && sermons.length > 0) {
    const askCoding = await codeApplicationAsks(codingInputs, codingOpts);
    m2Hits = askCoding.filter((row) => row.namedObject).length;
    m3Hits = askCoding.filter((row) => row.namedCost).length;
  }
  if (needsCross && sermons.length > 0) {
    const crossCoding = await codeCrossNamedObjects(codingInputs, codingOpts);
    m8Hits = crossCoding.filter((row) => row.namedObject).length;
  }
  if (needsNaming && sermons.length > 0) {
    const namingCoding = await codeLocalNamings(codingInputs, codingOpts);
    m9Hits = namingCoding.filter((row) => row.noFaultNaming).length;
  }

  const n = sermons.length;
  const out: MovementCount[] = [];
  for (const id of measureIds) {
    if (id === 1) {
      out.push({ measureId: 1, hits: m1Hits, eligible: m1Eligible });
    } else if (id === 2) {
      out.push({ measureId: 2, hits: m2Hits, eligible: n });
    } else if (id === 3) {
      out.push({ measureId: 3, hits: m3Hits, eligible: n });
    } else if (id === 4) {
      out.push({ measureId: 4, hits: m4Hits, eligible: m4Eligible });
    } else if (id === 5) {
      out.push({ measureId: 5, hits: m5Hits, eligible: m5Eligible });
    } else if (id === 6) {
      out.push({ measureId: 6, hits: m6Hits, eligible: m6Eligible });
    } else if (id === 7) {
      out.push({ measureId: 7, hits: m7Hits, eligible: n });
    } else if (id === 8) {
      out.push({ measureId: 8, hits: m8Hits, eligible: n });
    } else if (id === 9) {
      out.push({ measureId: 9, hits: m9Hits, eligible: n });
    } else if (id === 11) {
      out.push({ measureId: 11, hits: m11Hits, eligible: m11Eligible });
    } else if (id === 12) {
      out.push({ measureId: 12, hits: m12Hits, eligible: n });
    } else {
      out.push({ measureId: id, hits: 0, eligible: 0 });
    }
  }
  return out;
}
