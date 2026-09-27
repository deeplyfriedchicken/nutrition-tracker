import { useCallback, useState } from "react";
import type { WaterUnit, WeightUnit } from "../../domain/units";

/** The site-wide display units. Stored data is unchanged (ml, kg). */
export type UnitPrefs = { water: WaterUnit; weight: WeightUnit };

const STORAGE_KEY = "nutrition-calendar:units";
const DEFAULTS: UnitPrefs = { water: "floz", weight: "lb" };

function load(): UnitPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Record<keyof UnitPrefs, unknown>>;
    return {
      water: parsed.water === "ml" || parsed.water === "floz" ? parsed.water : DEFAULTS.water,
      weight: parsed.weight === "kg" || parsed.weight === "lb" ? parsed.weight : DEFAULTS.weight,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(prefs: UnitPrefs): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable (private mode, blocked): the choice lasts for this page only.
  }
}

export function useUnitPrefs(): [UnitPrefs, (update: Partial<UnitPrefs>) => void] {
  const [prefs, setPrefs] = useState<UnitPrefs>(load);
  const update = useCallback((change: Partial<UnitPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...change };
      save(next);
      return next;
    });
  }, []);
  return [prefs, update];
}
