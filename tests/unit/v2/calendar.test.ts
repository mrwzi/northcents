import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  addCalendarMonths,
  compareCalendarDates,
  daysInMonth,
  differenceInCalendarDays,
  isLeapYear,
  parseCalendarDate,
  sameCalendarDate,
} from "../../../src/v2/domain/calendar";

describe("V2 CalendarDate", () => {
  it.each(["2026-01-01", "2028-02-29", "9999-12-31"])("accepts %s", (value) => {
    expect(parseCalendarDate(value)).toBe(value);
  });
  it.each([
    "2026-2-01",
    "2026-02-29",
    "2026-13-01",
    "2026-00-10",
    "2026-04-31",
    "0000-01-01",
  ])("rejects %s", (value) => {
    expect(() => parseCalendarDate(value)).toThrow();
  });
  it("implements Gregorian leap years", () => {
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });
  it("adds days across leap and month boundaries", () => {
    expect(addCalendarDays(parseCalendarDate("2028-02-28"), 1)).toBe(
      "2028-02-29",
    );
    expect(addCalendarDays(parseCalendarDate("2028-02-29"), 1)).toBe(
      "2028-03-01",
    );
    expect(addCalendarDays(parseCalendarDate("2026-03-01"), -1)).toBe(
      "2026-02-28",
    );
  });
  it("adds months with end-of-month clamp without changing later nominal inputs", () => {
    const january = parseCalendarDate("2026-01-31");
    expect(addCalendarMonths(january, 1)).toBe("2026-02-28");
    expect(addCalendarMonths(january, 2)).toBe("2026-03-31");
    expect(addCalendarMonths(parseCalendarDate("2028-01-31"), 1)).toBe(
      "2028-02-29",
    );
  });
  it("compares and differences dates deterministically", () => {
    const a = parseCalendarDate("2026-01-01");
    const b = parseCalendarDate("2026-01-15");
    expect(compareCalendarDates(a, b)).toBe(-1);
    expect(compareCalendarDates(b, a)).toBe(1);
    expect(sameCalendarDate(a, a)).toBe(true);
    expect(differenceInCalendarDays(a, b)).toBe(14);
  });
});
