import { useEffect, useRef, useState } from "react";
import type { Day, DayIndex, WeighInLog } from "../domain/types";
import { fetchDay, fetchIndex, fetchWeighIns } from "./lib/data";
import { isValidDateString, pickInitialDate } from "./lib/dateSelection";
import { type MonthKey, monthKeyFromDate } from "./lib/calendar";
import { todayInTimeZone } from "./lib/timezone";
import { Calendar } from "./components/Calendar";
import { Detail } from "./components/Detail";
import "./styles.css";

function getUrlDate(): string | null {
  return new URLSearchParams(window.location.search).get("date");
}

function setUrlDate(date: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("date", date);
  window.history.replaceState(null, "", url);
}

export function App() {
  const [index, setIndex] = useState<DayIndex | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [weighIns, setWeighIns] = useState<WeighInLog>({ schemaVersion: 1, weighIns: {} });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<MonthKey | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const dayCache = useRef(new Map<string, Day>());

  useEffect(() => {
    fetchIndex()
      .then((idx) => {
        setIndex(idx);
        const dayDates = Object.keys(idx.days).sort();
        const timezone = idx.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const today = todayInTimeZone(timezone);
        const urlDate = getUrlDate();
        const initial = pickInitialDate({
          urlDate: urlDate && isValidDateString(urlDate) ? urlDate : null,
          today,
          dayDates,
        });
        setSelectedDate(initial);
        setVisibleMonth(monthKeyFromDate(initial));
        setUrlDate(initial);
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
    setUrlDate(date);
  }

  const timezone = index ? index.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone : null;
  const today = timezone ? todayInTimeZone(timezone) : null;

  return (
    <div className="page">
      <div className="page-inner">
        <div className="header">
          <h1 className="heading-font title">Nutrition Calendar</h1>
          <p className="subtitle">A read-only look back at what was logged, day by day.</p>
        </div>

        {indexError && (
          <div className="error-state">Couldn&rsquo;t load nutrition data. Try refreshing the page.</div>
        )}

        {!indexError && index && selectedDate && visibleMonth && today && (
          <div className="layout">
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
            />
          </div>
        )}
      </div>
    </div>
  );
}
