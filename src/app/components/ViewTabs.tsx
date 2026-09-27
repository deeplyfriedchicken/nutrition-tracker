import type { View } from "../lib/url";

const TABS: Array<{ view: View; label: string }> = [
  { view: "calendar", label: "Calendar" },
  { view: "trends", label: "Trends" },
];

export function ViewTabs({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <div className="view-tabs" role="tablist" aria-label="View">
      {TABS.map((tab) => (
        <button
          key={tab.view}
          type="button"
          role="tab"
          id={`tab-${tab.view}`}
          aria-selected={tab.view === view}
          aria-controls={`panel-${tab.view}`}
          className={tab.view === view ? "view-tab view-tab--selected" : "view-tab"}
          onClick={() => onChange(tab.view)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
