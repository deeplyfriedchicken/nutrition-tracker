import type { ReactNode } from "react";
import { formatNumber } from "../../domain/format";
import { shortDateLabel } from "../lib/calendar";

/** Chart chrome shared by every Trends chart. */
export const CHART_HEIGHT = 180;
export const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 };
export const GRID_COLOR = "#ECE9E0";
export const AXIS_COLOR = "#C9C4B6";
export const AXIS_TICK = { fontSize: 11, fill: "#5B5648" };

export const xAxisProps = {
  dataKey: "date",
  tickFormatter: (d: string) => shortDateLabel(d),
  interval: "preserveStartEnd" as const,
  minTickGap: 14,
  tickLine: false,
  axisLine: { stroke: AXIS_COLOR },
  tick: AXIS_TICK,
  padding: { left: 10, right: 10 },
};

export const yAxisProps = {
  tickFormatter: (n: number) => formatNumber(n),
  axisLine: false,
  tickLine: false,
  tick: AXIS_TICK,
  width: 44,
};

/**
 * Round tick values (steps of 1, 2, 2.5 or 5 × 10^k) covering [min, max], about
 * four intervals, so the top tick is a clean number rather than the raw maximum.
 */
export function niceTicks(min: number, max: number): number[] {
  const span = max - min || 1;
  const rough = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t < max + step; t += step) {
    ticks.push(Number(t.toFixed(6)));
    if (t >= max) break;
  }
  return ticks;
}

type Props = {
  title: string;
  color: string;
  summary: ReactNode;
  toggle?: ReactNode;
  children: ReactNode;
};

export function TrendCard({ title, color, summary, toggle, children }: Props) {
  return (
    <section className="trend-card" aria-label={title}>
      <div className="trend-card-header">
        <span className="trend-key" style={{ ["--key-color" as string]: color }} aria-hidden="true">
          <span className="trend-key-dot" />
        </span>
        <h3 className="trend-title">{title}</h3>
        {toggle}
        <div className="trend-summary">{summary}</div>
      </div>
      {children}
    </section>
  );
}

/** The dot every point wears: 8px, filled, with a 2px surface ring; hollow when `hollow`. */
export function PointDot({ cx, cy, color, hollow }: { cx?: number; cy?: number; color: string; hollow?: boolean }) {
  if (cx == null || cy == null) return null;
  return hollow ? (
    <circle cx={cx} cy={cy} r={4} fill="#FFFFFF" stroke={color} strokeWidth={2} />
  ) : (
    <circle cx={cx} cy={cy} r={5} fill={color} stroke="#FFFFFF" strokeWidth={2} />
  );
}

/** The collapsed table twin of a chart, so no value is tooltip-only. */
export function DataTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: string[][] }) {
  if (rows.length === 0) return null;
  return (
    <details className="chart-data">
      <summary>Data table</summary>
      <div className="chart-data-scroll">
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells) => (
              <tr key={cells[0]}>
                {cells.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
