import { useMemo } from "react";
import type { Range } from "../../domain/range";
import { buildNutrientTrend, buildWeightTrend } from "../../domain/trends";
import type { DayIndex, WeighInLog } from "../../domain/types";
import { WATER_UNIT_LABEL, WEIGHT_UNIT_LABEL, convertWater } from "../../domain/units";
import { NUTRIENT_SERIES } from "../lib/trendSeries";
import type { UnitPrefs } from "../lib/unitPrefs";
import { NutrientChart } from "./NutrientChart";
import { RangeControls } from "./RangeControls";
import { UnitToggle } from "./UnitToggle";
import { WeightChart } from "./WeightChart";

type Props = {
  index: DayIndex;
  weighIns: WeighInLog;
  today: string;
  range: Range;
  onRangeChange: (range: Range) => void;
  units: UnitPrefs;
  onUnitsChange: (update: Partial<UnitPrefs>) => void;
};

const identity = (n: number) => n;

export function Trends({ index, weighIns, today, range, onRangeChange, units, onUnitsChange }: Props) {
  const dayDates = useMemo(() => Object.keys(index.days).sort(), [index]);

  const nutrientTrends = useMemo(
    () => NUTRIENT_SERIES.map((series) => ({ series, trend: buildNutrientTrend(index, range, series.key, today) })),
    [index, range, today],
  );
  const weightRows = useMemo(() => buildWeightTrend(weighIns, range), [weighIns, range]);

  const hasDays = nutrientTrends[0].trend.rows.some((r) => r.isDay);
  const hasWeighIns = weightRows.some((r) => r.kg !== null);

  const waterToggle = (
    <UnitToggle
      label="Water unit"
      value={units.water}
      options={[
        { value: "floz", label: WATER_UNIT_LABEL.floz },
        { value: "ml", label: WATER_UNIT_LABEL.ml },
      ]}
      onChange={(water) => onUnitsChange({ water })}
    />
  );
  const weightToggle = (
    <UnitToggle
      label="Weight unit"
      value={units.weight}
      options={[
        { value: "lb", label: WEIGHT_UNIT_LABEL.lb },
        { value: "kg", label: WEIGHT_UNIT_LABEL.kg },
      ]}
      onChange={(weight) => onUnitsChange({ weight })}
    />
  );

  return (
    <div className="trends-card">
      <RangeControls range={range} today={today} dayDates={dayDates} onChange={onRangeChange} />

      <div className="trend-grid">
        {hasDays ? (
          nutrientTrends.map(({ series, trend }) => {
            const isWater = series.unit === "water";
            return (
              <NutrientChart
                key={series.key}
                title={series.label}
                color={series.color}
                trend={trend}
                toDisplay={isWater ? (ml) => convertWater(ml, units.water) : identity}
                unitLabel={isWater ? WATER_UNIT_LABEL[units.water] : series.unit}
                toggle={isWater ? waterToggle : undefined}
              />
            );
          })
        ) : (
          <div className="empty-state trend-grid-full">Nothing logged in this range</div>
        )}

        {(hasDays || hasWeighIns) && <WeightChart rows={weightRows} unit={units.weight} toggle={weightToggle} />}
      </div>
    </div>
  );
}
