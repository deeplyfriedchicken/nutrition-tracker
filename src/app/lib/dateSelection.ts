import { isValidDateString } from "../../domain/dates";

export { isValidDateString };

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
