import { isValidDateString } from "../../domain/dates";
import { type Range, type RangePreset, RANGE_PRESETS, matchingPresets, normalizeRange, presetRange } from "../../domain/range";
import { rangeLabel } from "../lib/calendar";

const PRESET_LABEL: Record<RangePreset, string> = {
  last7: "Last 7 days",
  last14: "Last 14 days",
  thisMonth: "This month",
  allLogged: "All logged days",
};

type Props = {
  range: Range;
  today: string;
  dayDates: string[];
  onChange: (range: Range) => void;
};

/**
 * A typed date can pass through values like 0002-09-14 while the year is being
 * entered; those would build a Range of hundreds of thousands of dates. Ignore
 * anything before 1900 so only a fully typed year commits.
 */
function usableDate(value: string): boolean {
  return isValidDateString(value) && value >= "1900-01-01";
}

export function RangeControls({ range, today, dayDates, onChange }: Props) {
  const ctx = { today, dayDates };
  const highlighted = matchingPresets(range, ctx);

  return (
    <div className="range-controls">
      <div className="range-presets">
        {RANGE_PRESETS.map((preset) => {
          const target = presetRange(preset, ctx);
          const selected = highlighted.includes(preset);
          return (
            <button
              key={preset}
              type="button"
              className={selected ? "range-pill range-pill--selected" : "range-pill"}
              aria-pressed={selected}
              disabled={target === null}
              onClick={() => target && onChange(target)}
            >
              {PRESET_LABEL[preset]}
            </button>
          );
        })}
      </div>
      <div className="range-dates">
        <input
          type="date"
          className="range-input"
          aria-label="From"
          value={range.from}
          max={today}
          onChange={(e) => usableDate(e.target.value) && onChange(normalizeRange(e.target.value, range.to, today))}
        />
        <span className="range-to">to</span>
        <input
          type="date"
          className="range-input"
          aria-label="To"
          value={range.to}
          max={today}
          onChange={(e) => usableDate(e.target.value) && onChange(normalizeRange(range.from, e.target.value, today))}
        />
        <span className="range-label">{rangeLabel(range, today)}</span>
      </div>
    </div>
  );
}
