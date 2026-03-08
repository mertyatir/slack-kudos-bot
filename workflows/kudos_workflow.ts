import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GiveKudosFunction } from "../functions/give_kudos.ts";

const KudosWorkflow = DefineWorkflow({
  callback_id: "kudos_workflow",
  title: "Give Kudos",
  description: "Give kudos to a teammate",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
      channel: { type: Schema.slack.types.channel_id },
      user: { type: Schema.slack.types.user_id },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const formStep = KudosWorkflow.addStep(Schema.slack.functions.OpenForm, {
  title: "Give Kudos",
  interactivity: KudosWorkflow.inputs.interactivity,
  submit_label: "Send Kudos",
  fields: {
    elements: [
      {
        name: "receiver",
        title: "Who deserves kudos?",
        type: Schema.slack.types.user_id,
      },
      {
        name: "message",
        title: "Why are they awesome?",
        type: Schema.types.string,
        long: true,
      },
    ],
    required: ["receiver", "message"],
  },
});

KudosWorkflow.addStep(GiveKudosFunction, {
  giver_id: KudosWorkflow.inputs.user,
  receiver_id: formStep.outputs.fields.receiver,
  message: formStep.outputs.fields.message,
  channel_id: KudosWorkflow.inputs.channel,
});

export default KudosWorkflow;
