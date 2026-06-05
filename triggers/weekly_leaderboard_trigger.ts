import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerTypes } from "deno-slack-api/mod.ts";
import WeeklyLeaderboardWorkflow from "../workflows/weekly_leaderboard_workflow.ts";

// Fires every Friday at 10:00 Europe/Istanbul (07:00 UTC). start_time is the
// first occurrence (today, Fri 2026-06-05) and must be in the future.
const weeklyLeaderboardTrigger: Trigger<
  typeof WeeklyLeaderboardWorkflow.definition
> = {
  type: TriggerTypes.Scheduled,
  name: "Weekly Kudos Leaderboard",
  description: "Posts the kudos leaderboard to #general every Friday",
  workflow: `#/workflows/${WeeklyLeaderboardWorkflow.definition.callback_id}`,
  inputs: {},
  schedule: {
    start_time: "2026-06-05T07:00:00Z",
    timezone: "Europe/Istanbul",
    frequency: {
      type: "weekly",
      on_days: ["Friday"],
      repeats_every: 1,
    },
  },
};

export default weeklyLeaderboardTrigger;
