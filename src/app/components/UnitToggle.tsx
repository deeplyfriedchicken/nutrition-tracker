type Props<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

/** A small segmented control for a display unit (e.g. "fl oz | ml"). */
export function UnitToggle<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div className="unit-toggle" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? "unit-toggle-btn unit-toggle-btn--selected" : "unit-toggle-btn"}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
