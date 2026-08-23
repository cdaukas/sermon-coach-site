import { CANONICAL_CRITERION_NAMES } from "./tool-schema";

export const CANONICAL_CRITERION_NAME_BY_ID: Record<
  number,
  (typeof CANONICAL_CRITERION_NAMES)[number]
> = {
  1: CANONICAL_CRITERION_NAMES[0],
  2: CANONICAL_CRITERION_NAMES[1],
  3: CANONICAL_CRITERION_NAMES[2],
  4: CANONICAL_CRITERION_NAMES[3],
  5: CANONICAL_CRITERION_NAMES[4],
  6: CANONICAL_CRITERION_NAMES[5],
  7: CANONICAL_CRITERION_NAMES[6],
  8: CANONICAL_CRITERION_NAMES[7],
  9: CANONICAL_CRITERION_NAMES[8],
  10: CANONICAL_CRITERION_NAMES[9],
  11: CANONICAL_CRITERION_NAMES[10],
};

/** Known historical labels. Ids stay authoritative; these only document prior strings. */
export const LEGACY_CRITERION_NAME_ALIASES: Record<
  string,
  (typeof CANONICAL_CRITERION_NAMES)[number]
> = {
  "Heat Map: emotional delivery": CANONICAL_CRITERION_NAMES[7],
};

export function canonicalCriterionNameForId(
  id: number,
): (typeof CANONICAL_CRITERION_NAMES)[number] | undefined {
  return CANONICAL_CRITERION_NAME_BY_ID[id];
}

export function criterionIdFromName(name: string): number | undefined {
  const canonical = LEGACY_CRITERION_NAME_ALIASES[name] ?? name;
  const index = CANONICAL_CRITERION_NAMES.findIndex(
    (entry) => entry.toLowerCase() === canonical.toLowerCase(),
  );
  return index >= 0 ? index + 1 : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function criterionIdFromUnknown(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }
  return undefined;
}

/**
 * Rewrite stale criterion labels onto the canonical name for that id.
 * Must run before Zod parse. Invalid ids are left untouched so parse still fails.
 */
export function normalizeLegacyCriterionNames(
  value: unknown,
  options: { evaluationId?: string } = {},
): unknown {
  if (!isRecord(value) || !Array.isArray(value.categories)) {
    return value;
  }

  const categories = value.categories.map((category) => {
    if (!isRecord(category) || !Array.isArray(category.criteria)) {
      return category;
    }

    return {
      ...category,
      criteria: category.criteria.map((criterion) => {
        if (!isRecord(criterion)) {
          return criterion;
        }

        const id = criterionIdFromUnknown(criterion.id);
        if (id == null || id < 1 || id > 11) {
          return criterion;
        }

        const canonical = canonicalCriterionNameForId(id);
        if (!canonical) {
          return criterion;
        }

        const currentName =
          typeof criterion.name === "string" ? criterion.name : "";
        if (currentName === canonical) {
          return criterion;
        }

        if (
          currentName &&
          LEGACY_CRITERION_NAME_ALIASES[currentName] !== canonical
        ) {
          console.warn(
            "[normalizeLegacyCriterionNames] unexpected criterion name",
            {
              evaluationId: options.evaluationId ?? null,
              criterionId: id,
              name: currentName,
            },
          );
        }

        return { ...criterion, name: canonical };
      }),
    };
  });

  return { ...value, categories };
}
