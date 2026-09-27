import type { Day, WeighIn } from "../../domain/types";
import { isGoalMet } from "../../domain/goalMet";
import { formatLb, formatNumber } from "../../domain/format";
import { longDateLabel, weekdayLabel } from "../lib/calendar";
import { GOAL_DOT_NUTRIENTS } from "../lib/goalDots";

type Props = {
  date: string;
  day: Day | null;
  isDay: boolean;
  loading: boolean;
  weighIns: WeighIn[];
};

function latestWeighIn(weighIns: WeighIn[]): WeighIn | null {
  if (weighIns.length === 0) return null;
  return weighIns.reduce((a, b) => (a.recordedAt > b.recordedAt ? a : b));
}

export function Detail({ date, day, isDay, loading, weighIns }: Props) {
  const weighIn = latestWeighIn(weighIns);

  return (
    <div className="detail-card">
      <div className="detail-badge">{weekdayLabel(date)}</div>
      <h2 className="detail-date heading-font">{longDateLabel(date)}</h2>

      {isDay && loading && <div className="empty-state" style={{ marginTop: 22 }}>Loading&hellip;</div>}

      {isDay && !loading && day && <DayDetail day={day} weighIn={weighIn} />}

      {!isDay && (
        <div style={{ marginTop: 22 }}>
          <div className="empty-state">Nothing logged on this day.</div>
          {weighIn && <div className="empty-state-weight">Weight: {formatLb(weighIn.kg)} lb</div>}
        </div>
      )}
    </div>
  );
}

function DayDetail({ day, weighIn }: { day: Day; weighIn: WeighIn | null }) {
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
        {weighIn && <StatTile value={`${formatLb(weighIn.kg)} lb`} label="Weight" />}
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
            const unit = key === "waterMl" ? "ml" : "g";
            return (
              <div className="chip" key={key}>
                <span
                  className="chip-icon"
                  style={met ? { background: color } : { background: "transparent", border: `2px solid ${color}` }}
                />
                <div>
                  <div className="chip-label">{label}</div>
                  <div className="chip-detail">
                    {formatNumber(total)} / {formatNumber(goal)} {unit} &middot; {met ? "Met" : "Not met"}
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
          {formatNumber(day.totals.waterMl)} / {day.goals.waterMl !== null ? formatNumber(day.goals.waterMl) : "—"} ml
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
