import { describe, expect, it } from "vitest";
import { isGoalMet } from "../../src/domain/goalMet";

describe("isGoalMet", () => {
  it("is met at or above goal for at-least nutrients (calories, protein, carbs, fat, fiber, waterMl)", () => {
    expect(isGoalMet("calories", 3493, 3493)).toBe(true); // exact equality counts as met
    expect(isGoalMet("calories", 3494, 3493)).toBe(true);
    expect(isGoalMet("calories", 3492, 3493)).toBe(false);
    expect(isGoalMet("waterMl", 3000, 3000)).toBe(true);
    expect(isGoalMet("waterMl", 2999, 3000)).toBe(false);
  });

  it("is met at or below goal for at-most nutrients (sugar, sodium)", () => {
    expect(isGoalMet("sugar", 25, 25)).toBe(true); // exact equality counts as met
    expect(isGoalMet("sugar", 24, 25)).toBe(true);
    expect(isGoalMet("sugar", 26, 25)).toBe(false);
    expect(isGoalMet("sodium", 2300, 2300)).toBe(true);
    expect(isGoalMet("sodium", 2301, 2300)).toBe(false);
  });

  it("has no status when the goal is null", () => {
    expect(isGoalMet("calories", 3493, null)).toBeNull();
    expect(isGoalMet("sugar", 25, null)).toBeNull();
  });
});
