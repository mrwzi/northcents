import type { CalendarDate } from "./types";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
export const MIN_CALENDAR_YEAR = 1;
export const MAX_CALENDAR_YEAR = 9999;

export type CalendarDateParts = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  if (
    !Number.isInteger(year) ||
    year < MIN_CALENDAR_YEAR ||
    year > MAX_CALENDAR_YEAR
  )
    throw new RangeError("Year is outside the supported calendar range.");
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new RangeError("Month must be between 1 and 12.");
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseCalendarDate(value: string): CalendarDate {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new RangeError("Calendar date must use YYYY-MM-DD.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    year < MIN_CALENDAR_YEAR ||
    year > MAX_CALENDAR_YEAR ||
    month < 1 ||
    month > 12
  )
    throw new RangeError("Calendar date is outside the supported range.");
  if (day < 1 || day > daysInMonth(year, month))
    throw new RangeError("Calendar date does not exist.");
  return value as CalendarDate;
}

export function calendarDateParts(value: CalendarDate): CalendarDateParts {
  return {
    year: Number(value.slice(0, 4)),
    month: Number(value.slice(5, 7)),
    day: Number(value.slice(8, 10)),
  };
}

export function makeCalendarDate(
  year: number,
  month: number,
  day: number,
): CalendarDate {
  return parseCalendarDate(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  );
}

function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}
function daysFromCivil({
  year: inputYear,
  month,
  day,
}: CalendarDateParts): number {
  const year = inputYear - (month <= 2 ? 1 : 0);
  const era = floorDiv(year, 400);
  const yoe = year - era * 400;
  const adjustedMonth = month + (month > 2 ? -3 : 9);
  const doy = floorDiv(153 * adjustedMonth + 2, 5) + day - 1;
  return era * 146097 + yoe * 365 + floorDiv(yoe, 4) - floorDiv(yoe, 100) + doy;
}
function civilFromDays(value: number): CalendarDateParts {
  const era = floorDiv(value, 146097);
  const doe = value - era * 146097;
  const yoe = floorDiv(
    doe - floorDiv(doe, 1460) + floorDiv(doe, 36524) - floorDiv(doe, 146096),
    365,
  );
  let year = yoe + era * 400;
  const doy = doe - (365 * yoe + floorDiv(yoe, 4) - floorDiv(yoe, 100));
  const mp = floorDiv(5 * doy + 2, 153);
  const day = doy - floorDiv(153 * mp + 2, 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;
  return { year, month, day };
}

export function compareCalendarDates(
  a: CalendarDate,
  b: CalendarDate,
): -1 | 0 | 1 {
  return a === b ? 0 : a < b ? -1 : 1;
}
export function sameCalendarDate(a: CalendarDate, b: CalendarDate): boolean {
  return a === b;
}
export function addCalendarDays(
  date: CalendarDate,
  days: number,
): CalendarDate {
  if (!Number.isSafeInteger(days))
    throw new RangeError("Day adjustment must be a safe integer.");
  const result = civilFromDays(daysFromCivil(calendarDateParts(date)) + days);
  return makeCalendarDate(result.year, result.month, result.day);
}
export function differenceInCalendarDays(
  start: CalendarDate,
  end: CalendarDate,
): number {
  return (
    daysFromCivil(calendarDateParts(end)) -
    daysFromCivil(calendarDateParts(start))
  );
}
export function addCalendarMonths(
  date: CalendarDate,
  months: number,
): CalendarDate {
  if (!Number.isSafeInteger(months))
    throw new RangeError("Month adjustment must be a safe integer.");
  const parts = calendarDateParts(date);
  const absoluteMonth = parts.year * 12 + parts.month - 1 + months;
  const year = floorDiv(absoluteMonth, 12);
  const month = absoluteMonth - year * 12 + 1;
  return makeCalendarDate(
    year,
    month,
    Math.min(parts.day, daysInMonth(year, month)),
  );
}
export function clampedCalendarDate(
  year: number,
  month: number,
  nominalDay: number,
): CalendarDate {
  if (!Number.isInteger(nominalDay) || nominalDay < 1 || nominalDay > 31)
    throw new RangeError("Nominal day must be between 1 and 31.");
  return makeCalendarDate(
    year,
    month,
    Math.min(nominalDay, daysInMonth(year, month)),
  );
}
export function isoWeekday(date: CalendarDate): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const epochThursday = daysFromCivil({ year: 1970, month: 1, day: 1 });
  const value =
    ((((daysFromCivil(calendarDateParts(date)) - epochThursday + 3) % 7) + 7) %
      7) +
    1;
  return value as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}
