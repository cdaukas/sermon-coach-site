export type SeatCapacitySlice = {
  used: number;
  capacity: number;
  purchased: number;
  comp: number;
};

export type MentorSeatCapacity = {
  debrief: SeatCapacitySlice;
  evaluation: SeatCapacitySlice;
};

function asNonNegInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function asSlice(raw: unknown): SeatCapacitySlice {
  if (!raw || typeof raw !== "object") {
    return { used: 0, capacity: 0, purchased: 0, comp: 0 };
  }
  const row = raw as Record<string, unknown>;
  return {
    used: asNonNegInt(row.used),
    capacity: asNonNegInt(row.capacity),
    purchased: asNonNegInt(row.purchased),
    comp: asNonNegInt(row.comp),
  };
}

/** Shared by the server wrapper and the browser poller. Client-safe. */
export function parseMentorSeatCapacityPayload(
  data: unknown,
): MentorSeatCapacity | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const payload = data as Record<string, unknown>;
  if (payload.ok !== true) {
    return null;
  }
  return {
    debrief: asSlice(payload.debrief),
    evaluation: asSlice(payload.evaluation),
  };
}

export function mentorSeatCapacityIsPositive(
  capacity: MentorSeatCapacity,
): boolean {
  return capacity.debrief.capacity > 0 || capacity.evaluation.capacity > 0;
}
