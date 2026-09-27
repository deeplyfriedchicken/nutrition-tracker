import type { DayIndex } from "../../domain/types";
import { isGoalMet } from "../../domain/goalMet";
import {
  type MonthKey,
  dayOfMonth,
  monthGridCells,
  monthKeyOrder,
  monthKeyToLabel,
  navBounds,
  shiftMonth,
} from "../lib/calendar";
import { GOAL_DOT_NUTRIENTS } from "../lib/goalDots";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  index: DayIndex;
  today: string;
  selectedDate: string;
  visibleMonth: MonthKey;
  onSelect: (date: string) => void;
  onMonthChange: (month: MonthKey) => void;
};

export function Calendar({ index, today, selectedDate, visibleMonth, onSelect, onMonthChange }: Props) {
  const dayDatesAsc = Object.keys(index.days).sort();
  const { min, max } = navBounds(dayDatesAsc, today);
  const canGoPrev = monthKeyOrder(visibleMonth) > monthKeyOrder(min);
  const canGoNext = monthKeyOrder(visibleMonth) < monthKeyOrder(max);

  return (
    <div className="calendar-card">
      <div className="cal-header">
        <button
          type="button"
          className="cal-nav-btn"
          aria-label="Previous month"
          disabled={!canGoPrev}
          onClick={() => onMonthChange(shiftMonth(visibleMonth, -1))}
        >
          &#8592;
        </button>
        <span className="cal-month-label heading-font">{monthKeyToLabel(visibleMonth)}</span>
        <button
          type="button"
          className="cal-nav-btn"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => onMonthChange(shiftMonth(visibleMonth, 1))}
        >
          &#8594;
        </button>
      </div>

      <div className="weekday-row">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {monthGridCells(visibleMonth).map((date, i) =>
          date === null ? (
            <div key={i} className="cal-cell" />
          ) : (
            <div key={date} className="cal-cell">
              <DayButton
                date={date}
                isToday={date === today}
                isSelected={date === selectedDate}
                dayRow={index.days[date]}
                onSelect={onSelect}
              />
            </div>
          ),
        )}
      </div>

      <div className="legend">
        <div className="legend-row">
          {GOAL_DOT_NUTRIENTS.map(({ key, label, color }) => (
            <div className="legend-item" key={key}>
              <span className="goal-dot" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
        <div className="legend-note">Filled = goal met &middot; Ring = logged, goal missed</div>
      </div>
    </div>
  );
}

type DayButtonProps = {
  date: string;
  isToday: boolean;
  isSelected: boolean;
  dayRow: DayIndex["days"][string] | undefined;
  onSelect: (date: string) => void;
};

function DayButton({ date, isToday, isSelected, dayRow, onSelect }: DayButtonProps) {
  const classes = ["cal-day-btn"];
  if (isToday) classes.push("cal-day-btn--today");
  if (isSelected) classes.push("cal-day-btn--selected");

  return (
    <button type="button" className={classes.join(" ")} onClick={() => onSelect(date)}>
      <span>{dayOfMonth(date)}</span>
      {dayRow && (
        <span style={{ display: "flex", gap: 2 }}>
          {GOAL_DOT_NUTRIENTS.map(({ key, color }) => {
            const goal = dayRow.goals[key];
            if (goal === null) return null;
            const met = isGoalMet(key, dayRow.totals[key], goal);
            return (
              <span
                key={key}
                className="goal-dot"
                style={
                  met
                    ? { background: color }
                    : { background: "transparent", border: `1px solid ${color}` }
                }
              />
            );
          })}
        </span>
      )}
    </button>
  );
}
