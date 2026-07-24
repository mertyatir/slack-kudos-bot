import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import KudosDatastore from "../datastores/kudos_datastore.ts";
import { queryAllKudos } from "../datastores/query_all.ts";

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

  // Business-rule rejections aren't workflow errors — tell the giver privately
  // and finish the run successfully. `{ error }` is reserved for real failures,
  // which Slack surfaces to the app's managers, not the end user.
  const reject = async (text: string) => {
    await client.chat.postEphemeral({
      channel: channel_id,
      user: giver_id,
      text,
    });
    return { outputs: { confirmation: "not_sent" } };
  };

  if (giver_id === receiver_id) {
    return await reject(
      ":sweat_smile: You can't give kudos to yourself — pick a teammate!",
    );
  }

  const historyResponse = await queryAllKudos(client, {
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
    return await reject(
      `:hourglass_flowing_sand: You've used all ${WEEKLY_LIMIT} of your kudos for this week. They refresh on Monday!`,
    );
  }

  if (
    !monthlyReceivers.has(receiver_id) &&
    monthlyReceivers.size >= MONTHLY_DISTINCT_LIMIT
  ) {
    return await reject(
      `:calendar: You've already spread kudos to ${MONTHLY_DISTINCT_LIMIT} different people this month — the max. Your list resets on the 1st!`,
    );
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
