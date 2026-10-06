import { describe, expect, it } from "vitest";
import { parseCalendarDate } from "../../../src/v2/domain/calendar";
import { expandRecurrence } from "../../../src/v2/domain/recurrence";
const d = parseCalendarDate;
const base = {
  bounds: { startDate: d("2026-01-01") },
  horizonStart: d("2026-01-01"),
  horizonEnd: d("2026-03-31"),
} as const;
describe("V2 recurrence expansion", () => {
  it("expands weekly and inclusive boundaries", () => {
    expect(
      expandRecurrence({
        ...base,
        horizonEnd: d("2026-01-15"),
        recurrence: { kind: "weekly", intervalWeeks: 1, weekday: 4 },
      }).occurrences,
    ).toEqual(["2026-01-01", "2026-01-08", "2026-01-15"]);
  });
  it("expands biweekly exactly 14 days from anchor", () => {
    expect(
      expandRecurrence({
        ...base,
        horizonStart: d("2026-01-10"),
        horizonEnd: d("2026-02-10"),
        recurrence: { kind: "biweekly", anchorDate: d("2026-01-01") },
      }).occurrences,
    ).toEqual(["2026-01-15", "2026-01-29"]);
  });
  it("preserves a monthly nominal day", () => {
    expect(
      expandRecurrence({
        ...base,
        recurrence: { kind: "monthly", nominalDay: 31 },
      }).occurrences,
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });
  it("uses leap February", () => {
    expect(
      expandRecurrence({
        bounds: { startDate: d("2028-01-01") },
        horizonStart: d("2028-01-01"),
        horizonEnd: d("2028-03-31"),
        recurrence: { kind: "monthly", nominalDay: 31 },
      }).occurrences,
    ).toEqual(["2028-01-31", "2028-02-29", "2028-03-31"]);
  });
  it("coalesces semimonthly clamped duplicates with a diagnostic", () => {
    const result = expandRecurrence({
      bounds: { startDate: d("2026-02-01"), endDate: d("2026-02-28") },
      horizonStart: d("2026-02-01"),
      horizonEnd: d("2026-02-28"),
      recurrence: { kind: "semimonthly", firstDay: 30, secondDay: 31 },
    });
    expect(result.occurrences).toEqual(["2026-02-28"]);
    expect(result.diagnostics).toEqual([
      {
        kind: "coalesced-occurrence",
        date: "2026-02-28",
        nominalDays: [30, 31],
      },
    ]);
  });
  it("supports one-time, irregular, and recurrence end bounds", () => {
    expect(
      expandRecurrence({
        ...base,
        recurrence: { kind: "one-time", date: d("2026-02-02") },
      }).occurrences,
    ).toEqual(["2026-02-02"]);
    expect(
      expandRecurrence({ ...base, recurrence: { kind: "irregular" } })
        .occurrences,
    ).toEqual([]);
    expect(
      expandRecurrence({
        ...base,
        bounds: { startDate: d("2026-01-01"), endDate: d("2026-02-01") },
        recurrence: { kind: "monthly", nominalDay: 1 },
      }).occurrences,
    ).toEqual(["2026-01-01", "2026-02-01"]);
  });
});
