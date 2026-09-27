export type View = "calendar" | "trends";

export type UrlState = {
  view: View;
  date: string | null;
  from: string | null;
  to: string | null;
};

export function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  return {
    view: params.get("view") === "trends" ? "trends" : "calendar",
    date: params.get("date"),
    from: params.get("from"),
    to: params.get("to"),
  };
}

/**
 * Update only the given keys, keeping the rest. `view` is omitted from the URL
 * for the Calendar (missing means Calendar). Uses replaceState, as v1 does.
 */
export function writeUrlState(update: Partial<{ view: View; date: string; from: string; to: string }>): void {
  const url = new URL(window.location.href);
  for (const key of ["date", "from", "to"] as const) {
    const value = update[key];
    if (value !== undefined) url.searchParams.set(key, value);
  }
  if (update.view === "trends") url.searchParams.set("view", "trends");
  if (update.view === "calendar") url.searchParams.delete("view");
  window.history.replaceState(null, "", url);
}
