/** Today's date (YYYY-MM-DD) as seen from the given IANA timezone, e.g. the index's timezone. */
export function todayInTimeZone(timezone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, matching our date string convention.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(now);
}
