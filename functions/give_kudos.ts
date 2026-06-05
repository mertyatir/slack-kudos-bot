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

const WEEKLY_LIMIT = 3;
const MONTHLY_DISTINCT_LIMIT = 10;

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default SlackFunction(GiveKudosFunction, async ({ inputs, client }) => {
  const { giver_id, receiver_id, message, channel_id } = inputs;

  if (giver_id === receiver_id) {
    return { error: "You can't give kudos to yourself!" };
  }

  const historyResponse = await client.apps.datastore.query<
    typeof KudosDatastore.definition
  >({
    datastore: "kudos",
    expression: "#giver = :giver",
    expression_attributes: { "#giver": "giver_id" },
    expression_values: { ":giver": giver_id },
  });

  if (!historyResponse.ok) {
    return { error: `Failed to check kudos limits: ${historyResponse.error}` };
  }

  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  let weeklyGiven = 0;
  const monthlyReceivers = new Set<string>();
  for (const item of historyResponse.items) {
    if (item.created_at >= weekStart) weeklyGiven++;
    if (item.created_at >= monthStart) monthlyReceivers.add(item.receiver_id);
  }

  if (weeklyGiven >= WEEKLY_LIMIT) {
    return {
      error:
        `You've reached your weekly limit of ${WEEKLY_LIMIT} kudos. Try again next week!`,
    };
  }

  if (
    !monthlyReceivers.has(receiver_id) &&
    monthlyReceivers.size >= MONTHLY_DISTINCT_LIMIT
  ) {
    return {
      error:
        `You've already given kudos to ${MONTHLY_DISTINCT_LIMIT} different people this month. Try again next month!`,
    };
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
