import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { ShowLeaderboardFunction } from "../functions/show_leaderboard.ts";

const WeeklyLeaderboardWorkflow = DefineWorkflow({
  callback_id: "weekly_leaderboard_workflow",
  title: "Weekly Leaderboard",
  description: "Post the kudos leaderboard to #general every Friday",
  input_parameters: { properties: {}, required: [] },
});

// No user_id → ShowLeaderboardFunction posts publicly to #general (auto-resolved).
WeeklyLeaderboardWorkflow.addStep(ShowLeaderboardFunction, {});

export default WeeklyLeaderboardWorkflow;
