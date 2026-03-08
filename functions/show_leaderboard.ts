import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import KudosDatastore from "../datastores/kudos_datastore.ts";

export const ShowLeaderboardFunction = DefineFunction({
  callback_id: "show_leaderboard",
  title: "Show Leaderboard",
  source_file: "functions/show_leaderboard.ts",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      user_id: { type: Schema.slack.types.user_id },
    },
    required: ["channel_id", "user_id"],
  },
  output_parameters: {
    properties: {
      leaderboard: { type: Schema.types.string },
    },
    required: ["leaderboard"],
  },
});

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

const MEDALS = [":first_place_medal:", ":second_place_medal:", ":third_place_medal:"];

function formatLeaderboard(
  counts: Map<string, number>,
  title: string,
  limit = 10,
): string {
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return `*${title}*\nNo kudos yet!`;

  const lines = sorted.map(([userId, count], i) => {
    const medal = MEDALS[i] ?? `${i + 1}.`;
    return `${medal} <@${userId}> — ${count} kudos`;
  });

  return `*${title}*\n${lines.join("\n")}`;
}

export default SlackFunction(
  ShowLeaderboardFunction,
  async ({ inputs, client }) => {
    const weekStart = getWeekStart();

    const allTimeResponse = await client.apps.datastore.query<
      typeof KudosDatastore.definition
    >({ datastore: "kudos" });

    if (!allTimeResponse.ok) {
      return { error: `Failed to query kudos: ${allTimeResponse.error}` };
    }

    const allTimeCounts = new Map<string, number>();
    const weeklyCounts = new Map<string, number>();

    for (const item of allTimeResponse.items) {
      const receiver = item.receiver_id;
      allTimeCounts.set(receiver, (allTimeCounts.get(receiver) ?? 0) + 1);

      if (item.created_at >= weekStart) {
        weeklyCounts.set(receiver, (weeklyCounts.get(receiver) ?? 0) + 1);
      }
    }

    const weeklyBoard = formatLeaderboard(weeklyCounts, ":chart_with_upwards_trend: Weekly Leaderboard");
    const allTimeBoard = formatLeaderboard(allTimeCounts, ":trophy: All-Time Leaderboard");

    const leaderboard = `${weeklyBoard}\n\n${allTimeBoard}`;

    await client.chat.postEphemeral({
      channel: inputs.channel_id,
      user: inputs.user_id,
      text: leaderboard,
    });

    return { outputs: { leaderboard } };
  },
);
