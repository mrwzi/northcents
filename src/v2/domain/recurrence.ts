import {
  addCalendarDays,
  calendarDateParts,
  clampedCalendarDate,
  compareCalendarDates,
  differenceInCalendarDays,
  isoWeekday,
  parseCalendarDate,
} from "./calendar";
import type { CalendarDate } from "./types";

export type Recurrence =
  | Readonly<{
      kind: "weekly";
      intervalWeeks: number;
      weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    }>
  | Readonly<{ kind: "biweekly"; anchorDate: CalendarDate }>
  | Readonly<{ kind: "semimonthly"; firstDay: number; secondDay: number }>
  | Readonly<{ kind: "monthly"; nominalDay: number }>
  | Readonly<{ kind: "one-time"; date: CalendarDate }>
  | Readonly<{ kind: "irregular" }>;
export type RecurrenceBounds = Readonly<{
  startDate: CalendarDate;
  endDate?: CalendarDate;
}>;
export type RecurrenceDiagnostic = Readonly<{
  kind: "coalesced-occurrence";
  date: CalendarDate;
  nominalDays: readonly [number, number];
}>;
export type RecurrenceExpansion = Readonly<{
  occurrences: readonly CalendarDate[];
  diagnostics: readonly RecurrenceDiagnostic[];
}>;

function inRange(
  date: CalendarDate,
  lower: CalendarDate,
  upper: CalendarDate,
): boolean {
  return (
    compareCalendarDates(date, lower) >= 0 &&
    compareCalendarDates(date, upper) <= 0
  );
}
function later(a: CalendarDate, b: CalendarDate): CalendarDate {
  return compareCalendarDates(a, b) >= 0 ? a : b;
}
function earlier(a: CalendarDate, b: CalendarDate): CalendarDate {
  return compareCalendarDates(a, b) <= 0 ? a : b;
}
function checkNominalDay(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 31)
    throw new RangeError("Recurrence day must be between 1 and 31.");
}
function pushLimited(
  target: CalendarDate[],
  date: CalendarDate,
  limit: number,
): void {
  if (target.length >= limit)
    throw new RangeError("Recurrence expansion exceeded its occurrence limit.");
  target.push(date);
}

export function expandRecurrence(
  input: Readonly<{
    recurrence: Recurrence;
    bounds: RecurrenceBounds;
    horizonStart: CalendarDate;
    horizonEnd: CalendarDate;
    maxOccurrences?: number;
  }>,
): RecurrenceExpansion {
  if (
    compareCalendarDates(
      input.bounds.startDate,
      input.bounds.endDate ?? input.horizonEnd,
    ) > 0
  )
    throw new RangeError("Recurrence start must not follow its end.");
  if (compareCalendarDates(input.horizonStart, input.horizonEnd) > 0)
    throw new RangeError("Horizon start must not follow its end.");
  const lower = later(input.bounds.startDate, input.horizonStart);
  const upper = earlier(
    input.bounds.endDate ?? input.horizonEnd,
    input.horizonEnd,
  );
  if (compareCalendarDates(lower, upper) > 0)
    return { occurrences: [], diagnostics: [] };
  const limit = input.maxOccurrences ?? 10_000;
  if (!Number.isSafeInteger(limit) || limit <= 0)
    throw new RangeError("Occurrence limit must be positive.");
  const occurrences: CalendarDate[] = [];
  const diagnostics: RecurrenceDiagnostic[] = [];
  const recurrence = input.recurrence;

  if (recurrence.kind === "irregular") return { occurrences, diagnostics };
  if (recurrence.kind === "one-time") {
    if (inRange(recurrence.date, lower, upper))
      occurrences.push(recurrence.date);
    return { occurrences, diagnostics };
  }
  if (recurrence.kind === "weekly") {
    if (
      !Number.isSafeInteger(recurrence.intervalWeeks) ||
      recurrence.intervalWeeks <= 0
    )
      throw new RangeError("Weekly interval must be positive.");
    let first = input.bounds.startDate;
    first = addCalendarDays(
      first,
      (recurrence.weekday - isoWeekday(first) + 7) % 7,
    );
    const step = recurrence.intervalWeeks * 7;
    const offset = differenceInCalendarDays(first, lower);
    if (offset > 0)
      first = addCalendarDays(first, Math.ceil(offset / step) * step);
    for (
      let date = first;
      compareCalendarDates(date, upper) <= 0;
      date = addCalendarDays(date, step)
    )
      if (compareCalendarDates(date, lower) >= 0)
        pushLimited(occurrences, date, limit);
    return { occurrences, diagnostics };
  }
  if (recurrence.kind === "biweekly") {
    const offset = differenceInCalendarDays(recurrence.anchorDate, lower);
    let date = addCalendarDays(
      recurrence.anchorDate,
      Math.max(0, Math.ceil(offset / 14)) * 14,
    );
    while (compareCalendarDates(date, lower) < 0)
      date = addCalendarDays(date, 14);
    for (
      ;
      compareCalendarDates(date, upper) <= 0;
      date = addCalendarDays(date, 14)
    )
      if (compareCalendarDates(date, input.bounds.startDate) >= 0)
        pushLimited(occurrences, date, limit);
    return { occurrences, diagnostics };
  }

  const nominalDays: readonly number[] =
    recurrence.kind === "monthly"
      ? [recurrence.nominalDay]
      : [recurrence.firstDay, recurrence.secondDay];
  nominalDays.forEach(checkNominalDay);
  if (
    recurrence.kind === "semimonthly" &&
    recurrence.firstDay >= recurrence.secondDay
  )
    throw new RangeError("Semimonthly days must be distinct and ordered.");
  let { year, month } = calendarDateParts(lower);
  const end = calendarDateParts(upper);
  while (year < end.year || (year === end.year && month <= end.month)) {
    const resolved = nominalDays.map((day) =>
      clampedCalendarDate(year, month, day),
    );
    const unique = [...new Set(resolved)] as CalendarDate[];
    const coalescedDate = unique[0];
    if (
      recurrence.kind === "semimonthly" &&
      resolved.length === 2 &&
      unique.length === 1 &&
      coalescedDate !== undefined
    )
      diagnostics.push({
        kind: "coalesced-occurrence",
        date: coalescedDate,
        nominalDays: [recurrence.firstDay, recurrence.secondDay],
      });
    for (const date of unique.sort())
      if (inRange(date, lower, upper)) pushLimited(occurrences, date, limit);
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
  return { occurrences, diagnostics };
}

export function monthlyOccurrence(
  year: number,
  month: number,
  nominalDay: number,
): CalendarDate {
  checkNominalDay(nominalDay);
  return clampedCalendarDate(year, month, nominalDay);
}

export function oneTimeRecurrence(date: string): Recurrence {
  return { kind: "one-time", date: parseCalendarDate(date) };
}
