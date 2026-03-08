import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import LeaderboardWorkflow from "../workflows/leaderboard_workflow.ts";

const leaderboardTrigger: Trigger<typeof LeaderboardWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Leaderboard",
  description: "Show the kudos leaderboard",
  workflow: `#/workflows/${LeaderboardWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default leaderboardTrigger;
