import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, Tooltip, type TooltipContentProps, XAxis, YAxis } from "recharts";
import { formatNumber } from "../../domain/format";
import type { NutrientTrend, NutrientTrendRow } from "../../domain/trends";
import { tooltipDateLabel } from "../lib/calendar";
import {
  AXIS_COLOR,
  CHART_HEIGHT,
  CHART_MARGIN,
  DataTable,
  GRID_COLOR,
  PointDot,
  TrendCard,
  niceTicks,
  xAxisProps,
  yAxisProps,
} from "./TrendCard";

type Props = {
  title: string;
  color: string;
  trend: NutrientTrend;
  /** Stored units → display units (identity except water). */
  toDisplay: (n: number) => number;
  unitLabel: string;
  toggle?: ReactNode;
};

type ChartDatum = { date: string; value: number | null; goal: number | null; row: NutrientTrendRow };

export function NutrientChart({ title, color, trend, toDisplay, unitLabel, toggle }: Props) {
  const { rows, summary } = trend;
  const data: ChartDatum[] = rows.map((row) => ({
    date: row.date,
    value: row.total === null ? null : toDisplay(row.total),
    goal: row.goalLine === null ? null : toDisplay(row.goalLine),
    row,
  }));

  // 0-based; the top clears both the highest value and the highest goal.
  const highest = Math.max(0, ...data.map((d) => Math.max(d.value ?? 0, d.goal ?? 0)));
  const yTicks = niceTicks(0, highest > 0 ? highest * 1.1 : 1);

  const withUnit = (n: number) => `${formatNumber(n)} ${unitLabel}`;
  const average = summary.average === null ? null : `avg ${withUnit(toDisplay(summary.average))} per logged day`;
  const summaryText =
    summary.hasGoal && summary.judgedCount > 0
      ? [`${summary.metCount} of ${summary.judgedCount} logged days met goal`, average].filter(Boolean).join(" · ")
      : average;

  return (
    <TrendCard title={title} color={color} summary={summaryText} toggle={toggle}>
      <LineChart
        responsive
        style={{ width: "100%", height: CHART_HEIGHT }}
        data={data}
        margin={CHART_MARGIN}
        title={`${title} per day`}
      >
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} domain={[0, yTicks[yTicks.length - 1]]} ticks={yTicks} />
        <Tooltip
          content={(props) => <NutrientTooltip {...props} color={color} withUnit={withUnit} toDisplay={toDisplay} />}
          cursor={{ stroke: AXIS_COLOR, strokeWidth: 1 }}
          isAnimationActive={false}
        />
        {summary.hasGoal && (
          <Line
            dataKey="goal"
            name="Goal"
            type="stepAfter"
            stroke="#5B5648"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={(p) => <IsolatedGoalTick key={`goal-${p.index}`} cx={p.cx} cy={p.cy} index={p.index} data={data} />}
            activeDot={false}
            isAnimationActive={false}
            tooltipType="none"
          />
        )}
        <Line
          dataKey="value"
          name={title}
          type="linear"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          dot={(p) => (
            <PointDot key={`dot-${p.index}`} cx={p.cx} cy={p.cy} color={color} hollow={Boolean(p.payload?.row?.inProgress)} />
          )}
          activeDot={(p) => (
            <PointDot key={`active-${p.index}`} cx={p.cx} cy={p.cy} color={color} hollow={Boolean(p.payload?.row?.inProgress)} />
          )}
          isAnimationActive={false}
        />
      </LineChart>
      <DataTable
        caption={`${title} for each logged day in the range`}
        columns={["Date", title, "Goal", "Status"]}
        rows={rows
          .filter((r) => r.isDay)
          .map((r) => [
            tooltipDateLabel(r.date),
            withUnit(toDisplay(r.total as number)),
            r.dayGoal === null ? "—" : withUnit(toDisplay(r.dayGoal)),
            statusLabel(r),
          ])}
      />
    </TrendCard>
  );
}

function statusLabel(row: NutrientTrendRow): string {
  if (row.inProgress) return "In progress";
  if (row.met === null) return "No goal";
  return row.met ? "Met" : "Not met";
}

/**
 * A goal with no neighbouring goal value has nothing to step to, so the dashed
 * line would be invisible there; draw a short dashed tick at that date instead.
 */
function IsolatedGoalTick({ cx, cy, index, data }: { cx?: number; cy?: number; index: number; data: ChartDatum[] }) {
  if (cx == null || cy == null || data[index]?.goal == null) return null;
  const isolated = (data[index - 1]?.goal ?? null) === null && (data[index + 1]?.goal ?? null) === null;
  if (!isolated) return null;
  return <line x1={cx - 16} x2={cx + 16} y1={cy} y2={cy} stroke="#5B5648" strokeWidth={1} strokeDasharray="4 4" />;
}

type TooltipExtra = { color: string; withUnit: (n: number) => string; toDisplay: (n: number) => number };

function NutrientTooltip({ active, payload, color, withUnit, toDisplay }: TooltipContentProps & TooltipExtra) {
  const datum = payload?.[0]?.payload as ChartDatum | undefined;
  if (!active || !datum || !datum.row.isDay) return null; // no tooltip on dates that aren't Days
  const { row } = datum;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{tooltipDateLabel(row.date)}</div>
      <div className="chart-tooltip-value">
        <span className="chart-tooltip-key" style={{ background: color }} />
        {withUnit(toDisplay(row.total as number))}
      </div>
      {row.dayGoal !== null && <div className="chart-tooltip-detail">goal {withUnit(toDisplay(row.dayGoal))}</div>}
      {(row.inProgress || row.met !== null) && <div className="chart-tooltip-detail">{statusLabel(row)}</div>}
    </div>
  );
}
