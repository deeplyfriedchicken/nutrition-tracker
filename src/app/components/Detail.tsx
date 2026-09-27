import type { Day, WeighIn } from "../../domain/types";
import { isGoalMet } from "../../domain/goalMet";
import { formatNumber } from "../../domain/format";
import { WATER_UNIT_LABEL, convertWater, formatWeight } from "../../domain/units";
import { longDateLabel, weekdayLabel } from "../lib/calendar";
import { GOAL_DOT_NUTRIENTS } from "../lib/goalDots";
import type { UnitPrefs } from "../lib/unitPrefs";

type Props = {
  date: string;
  day: Day | null;
  isDay: boolean;
  loading: boolean;
  weighIns: WeighIn[];
  units: UnitPrefs;
};

function latestWeighIn(weighIns: WeighIn[]): WeighIn | null {
  if (weighIns.length === 0) return null;
  return weighIns.reduce((a, b) => (a.recordedAt > b.recordedAt ? a : b));
}

export function Detail({ date, day, isDay, loading, weighIns, units }: Props) {
  const weighIn = latestWeighIn(weighIns);

  return (
    <div className="detail-card">
      <div className="detail-badge">{weekdayLabel(date)}</div>
      <h2 className="detail-date heading-font">{longDateLabel(date)}</h2>

      {isDay && loading && <div className="empty-state" style={{ marginTop: 22 }}>Loading&hellip;</div>}

      {isDay && !loading && day && <DayDetail day={day} weighIn={weighIn} units={units} />}

      {!isDay && (
        <div style={{ marginTop: 22 }}>
          <div className="empty-state">Nothing logged on this day.</div>
          {weighIn && <div className="empty-state-weight">Weight: {formatWeight(weighIn.kg, units.weight)}</div>}
        </div>
      )}
    </div>
  );
}

function DayDetail({ day, weighIn, units }: { day: Day; weighIn: WeighIn | null; units: UnitPrefs }) {
  // Water is stored in ml; show it in the preferred unit. Goal Met stays in ml.
  const water = (ml: number) => formatNumber(convertWater(ml, units.water));
  const waterUnit = WATER_UNIT_LABEL[units.water];
  const foodItems = day.items.filter((item) => !item.isWater);
  const waterItems = day.items.filter((item) => item.isWater);

  return (
    <>
      <div className="stat-row" style={{ marginTop: 18 }}>
        <StatTile
          value={formatNumber(day.totals.calories)}
          label={day.goals.calories !== null ? `of ${formatNumber(day.goals.calories)} kcal` : "kcal"}
        />
        <StatTile value={`${formatNumber(day.totals.protein)} g`} label="Protein" />
        <StatTile value={`${formatNumber(day.totals.carbs)} g`} label="Carbs" />
        <StatTile value={`${formatNumber(day.totals.fat)} g`} label="Fat" />
        {weighIn && <StatTile value={formatWeight(weighIn.kg, units.weight)} label="Weight" />}
      </div>

      <div className="micro-row">
        <span className="micro-item">
          Sugar {formatNumber(day.totals.sugar)} / {day.goals.sugar !== null ? formatNumber(day.goals.sugar) : "—"} g
        </span>
        <span className="micro-item">
          Fiber {formatNumber(day.totals.fiber)} / {day.goals.fiber !== null ? formatNumber(day.goals.fiber) : "—"} g
        </span>
        <span className="micro-item">
          Sodium {formatNumber(day.totals.sodium)} / {day.goals.sodium !== null ? formatNumber(day.goals.sodium) : "—"} mg
        </span>
      </div>

      <div className="section">
        <div className="section-label">Goals</div>
        <div className="chip-row">
          {GOAL_DOT_NUTRIENTS.map(({ key, label, color }) => {
            const goal = day.goals[key];
            if (goal === null) return null;
            const total = day.totals[key];
            const met = isGoalMet(key, total, goal);
            const isWater = key === "waterMl";
            const show = isWater ? water : formatNumber;
            const unit = isWater ? waterUnit : "g";
            return (
              <div className="chip" key={key}>
                <span
                  className="chip-icon"
                  style={met ? { background: color } : { background: "transparent", border: `2px solid ${color}` }}
                />
                <div>
                  <div className="chip-label">{label}</div>
                  <div className="chip-detail">
                    {show(total)} / {show(goal)} {unit} &middot; {met ? "Met" : "Not met"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="water-header">
          <span className="water-header-text">Water</span>
        </div>
        <div className="water-amount">
          {water(day.totals.waterMl)} / {day.goals.waterMl !== null ? water(day.goals.waterMl) : "—"} {waterUnit}
        </div>
        <div className="water-caption">
          {waterItems.length > 0 ? `From: ${waterItems.map((i) => i.description).join(", ")}` : "No water logged"}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Food</div>
        <div className="food-list">
          {foodItems.map((item) => (
            <FoodItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-value">{value}</div>
      <div className="stat-tile-label">{label}</div>
    </div>
  );
}

function FoodItemRow({ item }: { item: Day["items"][number] }) {
  const showDetailedDescription = item.detailedDescription !== null && item.detailedDescription !== item.description;

  return (
    <div className="food-item">
      <div className="food-body">
        <div className="food-top-row">
          <span className="food-name">{item.description}</span>
          {item.confidence !== null && <span className="food-confidence">{item.confidence}% confidence</span>}
        </div>
        {showDetailedDescription && <div className="food-detail">{item.detailedDescription}</div>}
        {item.aiComment !== null && <div className="food-detail">{item.aiComment}</div>}
        <div className="food-macros">
          {formatNumber(item.nutrition.calories)} kcal &middot; {formatNumber(item.nutrition.protein)} g protein &middot;{" "}
          {formatNumber(item.nutrition.carbs)} g carbs &middot; {formatNumber(item.nutrition.fat)} g fat
        </div>
        <div className="food-micros">
          Sugar {formatNumber(item.nutrition.sugar)} g &middot; Fiber {formatNumber(item.nutrition.fiber)} g &middot; Sodium{" "}
          {formatNumber(item.nutrition.sodium)} mg
        </div>
      </div>
    </div>
  );
}
