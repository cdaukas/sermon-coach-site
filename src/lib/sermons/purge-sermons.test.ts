import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ARCHIVE_RETENTION_MS,
  SERMON_PURGE_RETENTION_MS,
  archiveCountsMatch,
  archiveSweepCutoffIso,
  buildArchiveRows,
  countArchiveInsertsBySourceTable,
  evaluatePurgeSkipGuards,
  expectedArchiveCounts,
  isSermonPurgeDryRun,
  purgeEligibilityCutoffIso,
  purgeReasonTag,
} from "./purge-sermons";

describe("isSermonPurgeDryRun", () => {
  it("defaults to report-only for undefined, empty, and non-false values", () => {
    assert.equal(isSermonPurgeDryRun(undefined), true);
    assert.equal(isSermonPurgeDryRun(""), true);
    assert.equal(isSermonPurgeDryRun("true"), true);
    assert.equal(isSermonPurgeDryRun("0"), true);
    assert.equal(isSermonPurgeDryRun("False"), true);
  });

  it("goes live only for the literal string false", () => {
    assert.equal(isSermonPurgeDryRun("false"), false);
  });
});

describe("cutoffs and reason tag", () => {
  it("computes 30-day and 7-day cutoffs from a fixed now", () => {
    const nowMs = Date.parse("2026-09-18T14:43:50.000Z");
    assert.equal(
      purgeEligibilityCutoffIso(nowMs),
      new Date(nowMs - SERMON_PURGE_RETENTION_MS).toISOString(),
    );
    assert.equal(
      archiveSweepCutoffIso(nowMs),
      new Date(nowMs - ARCHIVE_RETENTION_MS).toISOString(),
    );
  });

  it("builds a purge YYYY-MM-DD reason tag", () => {
    assert.equal(
      purgeReasonTag(new Date("2026-09-19T15:00:00.000Z")),
      "purge 2026-09-19",
    );
  });
});

describe("evaluatePurgeSkipGuards", () => {
  it("passes when evaluations are complete or failed with no special flags", () => {
    const result = evaluatePurgeSkipGuards([
      { id: "e1", status: "complete", is_public_sample: false },
      { id: "e2", status: "failed", mentor_relationship_id: null },
    ]);
    assert.deepEqual(result, { skip: false });
  });

  it("passes when there are no evaluations", () => {
    assert.deepEqual(evaluatePurgeSkipGuards([]), { skip: false });
  });

  it("skips public sample, mentored, and in-flight evaluations", () => {
    const result = evaluatePurgeSkipGuards([
      {
        id: "sample",
        status: "complete",
        is_public_sample: true,
      },
      {
        id: "mentored",
        status: "complete",
        mentor_relationship_id: "rel-1",
      },
      {
        id: "pending",
        status: "pending",
      },
      {
        id: "processing",
        status: "processing",
      },
      {
        id: "ok",
        status: "complete",
      },
    ]);
    assert.equal(result.skip, true);
    if (!result.skip) {
      return;
    }
    assert.deepEqual(result.reasons.sort(), [
      "is_public_sample",
      "mentor_relationship_id",
      "pending_or_processing",
    ]);
    assert.deepEqual(result.evaluationIds.sort(), [
      "mentored",
      "pending",
      "processing",
      "sample",
    ]);
  });
});

describe("archive row builders", () => {
  it("archives evaluations, versions, then the sermon", () => {
    const rows = buildArchiveRows({
      reason: "purge 2026-09-19",
      archivedAt: "2026-09-19T15:00:00.000Z",
      evaluations: [{ id: "e1" }],
      versions: [{ id: "v1" }, { id: "v2" }],
      sermon: { id: "s1" },
    });
    assert.equal(rows.length, 4);
    assert.equal(rows[0]?.source_table, "sermon_evaluations");
    assert.equal(rows[1]?.source_table, "sermon_versions");
    assert.equal(rows[2]?.source_table, "sermon_versions");
    assert.equal(rows[3]?.source_table, "sermons");
    assert.equal(rows[3]?.reason, "purge 2026-09-19");
  });

  it("requires matching per-table archive insert counts", () => {
    const expected = expectedArchiveCounts({
      evaluationCount: 1,
      versionCount: 2,
    });
    const actual = countArchiveInsertsBySourceTable([
      { source_table: "sermon_evaluations" },
      { source_table: "sermon_versions" },
      { source_table: "sermon_versions" },
      { source_table: "sermons" },
    ]);
    assert.equal(archiveCountsMatch(expected, actual), true);
    assert.equal(
      archiveCountsMatch(
        expected,
        countArchiveInsertsBySourceTable([
          { source_table: "sermon_evaluations" },
          { source_table: "sermons" },
        ]),
      ),
      false,
    );
  });
});
