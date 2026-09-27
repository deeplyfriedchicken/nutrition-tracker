# Each Day stores its own Goals Snapshot

Amy's API only returns the user's *current* goals, even when asked for a past date, so there is no goal history to fetch. We copy the goals into each Day file whenever that Day is refreshed; once a Day leaves the refresh window its Goals Snapshot is frozen, and over time the repo accumulates a goal history Amy doesn't provide. We rejected a single shared goals file (changing a goal would silently re-judge every past Day) and a goal change log (more logic for the same outcome).

## Consequences

- A Day's goals will deliberately disagree with what Amy shows today once goals change — that's the point, not a bug.
- Days loaded by a backfill get the goals current at backfill time; true historical goals before this project started are unrecoverable.
- Goal Met is always computed against the Day's own Goals Snapshot, never against current goals.
