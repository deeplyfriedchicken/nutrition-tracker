/** Thousands separators, at most 1 decimal, trailing ".0" dropped. */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
