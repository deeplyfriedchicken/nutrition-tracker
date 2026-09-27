import { describe, expect, it } from "vitest";
import { convertWater, convertWeight, formatWater, formatWeight } from "../../src/domain/units";

describe("water units", () => {
  it("converts ml to US fl oz (1 fl oz = 29.5735 ml) and leaves ml unchanged", () => {
    expect(convertWater(29.5735, "floz")).toBeCloseTo(1, 10);
    expect(convertWater(3000, "floz")).toBeCloseTo(101.442, 3);
    expect(convertWater(3000, "ml")).toBe(3000);
  });

  it("formats with the unit, thousands separators and at most 1 decimal", () => {
    expect(formatWater(3000, "floz")).toBe("101.4 fl oz");
    expect(formatWater(887, "floz")).toBe("30 fl oz");
    expect(formatWater(2661, "ml")).toBe("2,661 ml");
  });
});

describe("weight units", () => {
  it("converts kg to lb (kg × 2.20462) and leaves kg unchanged", () => {
    expect(convertWeight(1, "lb")).toBeCloseTo(2.20462, 10);
    expect(convertWeight(74.84268, "lb")).toBeCloseTo(165, 2); // the onboarding weigh-in: 165 lb
    expect(convertWeight(74.84268, "kg")).toBe(74.84268);
  });

  it("formats with the unit and at most 1 decimal, dropping a trailing .0", () => {
    expect(formatWeight(74.84268, "lb")).toBe("165 lb");
    expect(formatWeight(84, "lb")).toBe("185.2 lb");
    expect(formatWeight(74.84268, "kg")).toBe("74.8 kg");
    expect(formatWeight(80, "kg")).toBe("80 kg");
  });
});
