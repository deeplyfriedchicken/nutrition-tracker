import { useEffect, useRef, useState } from "react";
import type { Day, DayIndex, WeighInLog } from "../domain/types";
import { type Range, rangeFromUrl } from "../domain/range";
import { fetchDay, fetchIndex, fetchWeighIns } from "./lib/data";
import { isValidDateString, pickInitialDate } from "./lib/dateSelection";
import { type MonthKey, monthKeyFromDate } from "./lib/calendar";
import { todayInTimeZone } from "./lib/timezone";
import { type View, readUrlState, writeUrlState } from "./lib/url";
import { useUnitPrefs } from "./lib/unitPrefs";
import { Calendar } from "./components/Calendar";
import { Detail } from "./components/Detail";
import { Trends } from "./components/Trends";
import { ViewTabs } from "./components/ViewTabs";
import "./styles.css";

export function App() {
  const [index, setIndex] = useState<DayIndex | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [weighIns, setWeighIns] = useState<WeighInLog>({ schemaVersion: 1, weighIns: {} });
  const [view, setView] = useState<View>(() => readUrlState().view);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<MonthKey | null>(null);
  const [range, setRange] = useState<Range | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [units, setUnits] = useUnitPrefs();
  const dayCache = useRef(new Map<string, Day>());

  useEffect(() => {
    fetchIndex()
      .then((idx) => {
        setIndex(idx);
        const dayDates = Object.keys(idx.days).sort();
        const timezone = idx.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const today = todayInTimeZone(timezone);
        const url = readUrlState();
        const initial = pickInitialDate({
          urlDate: url.date && isValidDateString(url.date) ? url.date : null,
          today,
          dayDates,
        });
        const initialRange = rangeFromUrl({ from: url.from, to: url.to }, { today });
        setSelectedDate(initial);
        setVisibleMonth(monthKeyFromDate(initial));
        setRange(initialRange);
        // The URL always carries date, from and to, whichever view is open.
        writeUrlState({ date: initial, from: initialRange.from, to: initialRange.to });
      })
      .catch(() => setIndexError(true));

    fetchWeighIns()
      .then(setWeighIns)
      .catch(() => setWeighIns({ schemaVersion: 1, weighIns: {} }));
  }, []);

  useEffect(() => {
    if (!selectedDate || !index) return;
    if (!index.days[selectedDate]) {
      setSelectedDay(null);
      setDayLoading(false);
      return;
    }
    const cached = dayCache.current.get(selectedDate);
    if (cached) {
      setSelectedDay(cached);
      setDayLoading(false);
      return;
    }
    let cancelled = false;
    setSelectedDay(null);
    setDayLoading(true);
    fetchDay(selectedDate)
      .then((day) => {
        if (cancelled) return;
        dayCache.current.set(selectedDate, day);
        setSelectedDay(day);
      })
      .finally(() => {
        if (!cancelled) setDayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, index]);

  function selectDate(date: string) {
    setSelectedDate(date);
    setVisibleMonth(monthKeyFromDate(date));
    writeUrlState({ date });
  }

  function selectView(next: View) {
    setView(next);
    writeUrlState({ view: next });
  }

  function selectRange(next: Range) {
    setRange(next);
    writeUrlState({ from: next.from, to: next.to });
  }

  const timezone = index ? index.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone : null;
  const today = timezone ? todayInTimeZone(timezone) : null;
  const ready = !indexError && index && selectedDate && visibleMonth && range && today;

  return (
    <div className="page">
      <div className="page-inner">
        <div className="header">
          <h1 className="heading-font title">Nutrition Calendar</h1>
          <p className="subtitle">A read-only look back at what was logged.</p>
        </div>

        {indexError && (
          <div className="error-state">Couldn&rsquo;t load nutrition data. Try refreshing the page.</div>
        )}

        {ready && (
          <>
            <ViewTabs view={view} onChange={selectView} />

            {view === "calendar" ? (
              <div className="layout" role="tabpanel" id="panel-calendar" aria-labelledby="tab-calendar">
                <Calendar
                  index={index}
                  today={today}
                  selectedDate={selectedDate}
                  visibleMonth={visibleMonth}
                  onSelect={selectDate}
                  onMonthChange={setVisibleMonth}
                />
                <Detail
                  date={selectedDate}
                  day={selectedDay}
                  isDay={Boolean(index.days[selectedDate])}
                  loading={dayLoading}
                  weighIns={weighIns.weighIns[selectedDate] ?? []}
                  units={units}
                />
              </div>
            ) : (
              <div role="tabpanel" id="panel-trends" aria-labelledby="tab-trends">
                <Trends
                  index={index}
                  weighIns={weighIns}
                  today={today}
                  range={range}
                  onRangeChange={selectRange}
                  units={units}
                  onUnitsChange={setUnits}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
