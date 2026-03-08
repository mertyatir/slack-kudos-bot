import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ShowLeaderboardFunction } from "../functions/show_leaderboard.ts";

const LeaderboardWorkflow = DefineWorkflow({
  callback_id: "leaderboard_workflow",
  title: "Show Leaderboard",
  description: "Show the kudos leaderboard",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

LeaderboardWorkflow.addStep(ShowLeaderboardFunction, {
  channel_id: LeaderboardWorkflow.inputs.channel,
  user_id: LeaderboardWorkflow.inputs.user,
});

export default LeaderboardWorkflow;
