const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a well-formed, real YYYY-MM-DD calendar date (e.g. rejects 2026-02-30). */
export function isValidDateString(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Initial selection on load: the URL's ?date= if valid; else today if it's a
 * Day; else the most recent Day; else today.
 */
export function pickInitialDate(params: { urlDate: string | null; today: string; dayDates: string[] }): string {
  const { urlDate, today, dayDates } = params;
  if (urlDate && isValidDateString(urlDate)) return urlDate;
  if (dayDates.includes(today)) return today;
  if (dayDates.length > 0) return dayDates[dayDates.length - 1];
  return today;
}
