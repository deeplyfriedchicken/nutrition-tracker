import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, Tooltip, type TooltipContentProps, XAxis, YAxis } from "recharts";
import { type WeightTrendRow, summarizeWeightChange } from "../../domain/trends";
import { type WeightUnit, convertWeight, formatWeight, formatWeightChange } from "../../domain/units";
import { tooltipDateLabel } from "../lib/calendar";
import { WEIGHT_COLOR } from "../lib/trendSeries";
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

/** Padding above and below the fitted weight axis: 5 lb, or about the same in kg. */
const PADDING: Record<WeightUnit, number> = { lb: 5, kg: 2.5 };

type Props = { rows: WeightTrendRow[]; unit: WeightUnit; toggle?: ReactNode };

type ChartDatum = { date: string; value: number | null; kg: number | null };

export function WeightChart({ rows, unit, toggle }: Props) {
  const change = summarizeWeightChange(rows);
  const data: ChartDatum[] = rows.map((r) => ({
    date: r.date,
    kg: r.kg,
    value: r.kg === null ? null : convertWeight(r.kg, unit),
  }));

  const values = data.flatMap((d) => (d.value === null ? [] : [d.value]));
  // Fitted, not 0-based: lowest − padding to highest + padding, on clean ticks.
  const yTicks =
    values.length > 0 ? niceTicks(Math.min(...values) - PADDING[unit], Math.max(...values) + PADDING[unit]) : [0, 1];

  return (
    <TrendCard title="Weight" color={WEIGHT_COLOR} summary={change && formatWeightChange(change, unit)} toggle={toggle}>
      {change === null ? (
        <div className="trend-empty">No weigh-ins in this range</div>
      ) : (
        <>
          <LineChart
            responsive
            style={{ width: "100%", height: CHART_HEIGHT }}
            data={data}
            margin={CHART_MARGIN}
            title="Weight per day"
          >
            <CartesianGrid vertical={false} stroke={GRID_COLOR} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} domain={[yTicks[0], yTicks[yTicks.length - 1]]} ticks={yTicks} />
            <Tooltip
              content={(props) => <WeightTooltip {...props} unit={unit} />}
              cursor={{ stroke: AXIS_COLOR, strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="value"
              name="Weight"
              type="linear"
              stroke={WEIGHT_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              dot={(p) => <PointDot key={`dot-${p.index}`} cx={p.cx} cy={p.cy} color={WEIGHT_COLOR} />}
              activeDot={(p) => <PointDot key={`active-${p.index}`} cx={p.cx} cy={p.cy} color={WEIGHT_COLOR} />}
              isAnimationActive={false}
            />
          </LineChart>
          <DataTable
            caption="Weight for each weigh-in in the range"
            columns={["Date", "Weight"]}
            rows={rows.flatMap((r) => (r.kg === null ? [] : [[tooltipDateLabel(r.date), formatWeight(r.kg, unit)]]))}
          />
        </>
      )}
    </TrendCard>
  );
}

function WeightTooltip({ active, payload, unit }: TooltipContentProps & { unit: WeightUnit }) {
  const datum = payload?.[0]?.payload as ChartDatum | undefined;
  if (!active || !datum || datum.kg === null) return null; // no tooltip on dates without a Weigh-in
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date">{tooltipDateLabel(datum.date)}</div>
      <div className="chart-tooltip-value">
        <span className="chart-tooltip-key" style={{ background: WEIGHT_COLOR }} />
        {formatWeight(datum.kg, unit)}
      </div>
    </div>
  );
}
