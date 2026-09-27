# Nutrition Calendar

A read-only, public look back at a personal Amy food journal, one calendar day at a time. Data is copied from Amy on a schedule; the site never talks to Amy directly.

## Language

### Journal

**Day**:
One calendar date in the user's Amy timezone on which at least one Item was logged. A date with nothing logged is not a Day.
_Avoid_: Date record, log, journal day

**Item**:
One food or drink line logged on a Day, with its own nutrition, confidence, and optional detailed description and AI comment.
_Avoid_: Food, line, food item

**Water Item**:
An Item that records only water intake, measured in millilitres; shown with water, not in the food list.
_Avoid_: Drink, hydration entry

**Entry**:
Amy's grouping of Items within a date. Not part of this model — Items belong directly to a Day.

**Weigh-in**:
A single body-weight measurement in kilograms, recorded on a date. Weigh-ins are kept for every date, independent of Days; a Weigh-in never creates a Day, but is shown alongside the Day for its date when one exists.
_Avoid_: Weight entry, weight log

### Goals

**Goals Snapshot**:
The nutrition and water goals recorded on a Day at the time it was last copied from Amy; once the Day stops being refreshed, its Goals Snapshot never changes.
_Avoid_: Goals (unqualified), targets

**Goal Met**:
Whether a Day's total for one nutrient satisfies its Goals Snapshot. Most nutrients are met by reaching at least the goal; sugar and sodium are met by staying at or under it. A nutrient with no goal has no Goal Met status.
_Avoid_: Hit, on track, success
