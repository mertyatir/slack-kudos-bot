import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import KudosWorkflow from "../workflows/kudos_workflow.ts";

const kudosTrigger: Trigger<typeof KudosWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Give Kudos",
  description: "Give kudos to a teammate",
  workflow: `#/workflows/${KudosWorkflow.definition.callback_id}`,
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

export default kudosTrigger;
