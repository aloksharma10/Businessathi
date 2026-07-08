/**
 * Tanker booking dates are calendar dates (no time-of-day meaning). To keep them
 * stable regardless of the client's or server's timezone, we canonicalize every
 * booking date to UTC midnight of the chosen calendar day and always read/format
 * it back in UTC. This avoids the "off by one day" shift that happens when a
 * local-midnight date is floored on a UTC server (or vice-versa).
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC midnight of the UTC calendar day in `date` (for server-side canonicalization). */
export function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

/** UTC end-of-day of the UTC calendar day in `date`. */
export function utcDayEnd(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

/** UTC midnight of the calendar day represented by a local Date. */
export function toUtcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  );
}

/** UTC end-of-day of the calendar day represented by a local Date. */
export function toUtcDayEnd(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    )
  );
}

/** Convert an `<input type="date">` value ("yyyy-MM-dd") to a UTC-midnight Date. */
export function bookingDateFromInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Convert a stored booking date back to an "<input type=date>" value in UTC. */
export function bookingDateToInput(value: Date | string): string {
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )}`;
}

/** "dd MMM yyyy" in UTC (e.g. "08 Jul 2026"). */
export function formatBookingDate(value: Date | string): string {
  const d = new Date(value);
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "dd MMM" in UTC (e.g. "08 Jul"). */
export function formatBookingDayMonth(value: Date | string): string {
  const d = new Date(value);
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
}

/** Two-digit UTC month ("01".."12"). */
export function utcMonth(value: Date | string): string {
  return pad(new Date(value).getUTCMonth() + 1);
}

/** Four-digit UTC year. */
export function utcYear(value: Date | string): string {
  return String(new Date(value).getUTCFullYear());
}

/** "yyyyMMdd" in UTC, used as the per-day tanker number. */
export function utcTankerNo(value: Date | string): string {
  const d = new Date(value);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
    d.getUTCDate()
  )}`;
}

/** True when both dates fall on the same UTC calendar day. */
export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
