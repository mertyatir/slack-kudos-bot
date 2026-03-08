import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import KudosDatastore from "../datastores/kudos_datastore.ts";

export const GiveKudosFunction = DefineFunction({
  callback_id: "give_kudos",
  title: "Give Kudos",
  source_file: "functions/give_kudos.ts",
  input_parameters: {
    properties: {
      giver_id: { type: Schema.slack.types.user_id },
      receiver_id: { type: Schema.slack.types.user_id },
      message: { type: Schema.types.string },
      channel_id: { type: Schema.slack.types.channel_id },
    },
    required: ["giver_id", "receiver_id", "message", "channel_id"],
  },
  output_parameters: {
    properties: {
      confirmation: { type: Schema.types.string },
    },
    required: ["confirmation"],
  },
});

export default SlackFunction(GiveKudosFunction, async ({ inputs, client }) => {
  const { giver_id, receiver_id, message, channel_id } = inputs;

  if (giver_id === receiver_id) {
    return { error: "You can't give kudos to yourself!" };
  }

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const putResponse = await client.apps.datastore.put<
    typeof KudosDatastore.definition
  >({
    datastore: "kudos",
    item: { id, giver_id, receiver_id, message, created_at },
  });

  if (!putResponse.ok) {
    return { error: `Failed to save kudos: ${putResponse.error}` };
  }

  const kudosMessage =
    `:trophy: <@${giver_id}> gave kudos to <@${receiver_id}>!\n\n> ${message}`;

  await client.chat.postMessage({
    channel: channel_id,
    text: kudosMessage,
  });

  return { outputs: { confirmation: "Kudos sent!" } };
});
