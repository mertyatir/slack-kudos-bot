import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { queryAllKudos } from "../datastores/query_all.ts";

export const ShowLeaderboardFunction = DefineFunction({
  callback_id: "show_leaderboard",
  title: "Show Leaderboard",
  source_file: "functions/show_leaderboard.ts",
  input_parameters: {
    properties: {
      channel_id: { type: Schema.slack.types.channel_id },
      user_id: { type: Schema.slack.types.user_id },
    },
    required: [],
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

const MEDALS = [
  ":first_place_medal:",
  ":second_place_medal:",
  ":third_place_medal:",
];

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

async function resolveGeneralChannel(
  // deno-slack client is untyped for conversations.list pagination here
  // deno-lint-ignore no-explicit-any
  client: any,
): Promise<string | undefined> {
  let cursor: string | undefined;
  do {
    const res = await client.conversations.list({
      exclude_archived: true,
      types: "public_channel",
      limit: 200,
      cursor,
    });
    if (!res.ok) return undefined;
    const general = res.channels?.find((c: { is_general?: boolean }) =>
      c.is_general
    );
    if (general) return general.id;
    cursor = res.response_metadata?.cursor;
  } while (cursor);
  return undefined;
}

export default SlackFunction(
  ShowLeaderboardFunction,
  async ({ inputs, client }) => {
    const weekStart = getWeekStart();

    const allTimeResponse = await queryAllKudos(client);

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

    const weeklyBoard = formatLeaderboard(
      weeklyCounts,
      ":chart_with_upwards_trend: Weekly Leaderboard",
    );
    const allTimeBoard = formatLeaderboard(
      allTimeCounts,
      ":trophy: All-Time Leaderboard",
    );

    const leaderboard = `${weeklyBoard}\n\n${allTimeBoard}`;

    // On-demand (shortcut) invocation: user_id is set → ephemeral reply.
    // Scheduled invocation: no user_id → public post to #general.
    if (inputs.user_id) {
      await client.chat.postEphemeral({
        channel: inputs.channel_id,
        user: inputs.user_id,
        text: leaderboard,
      });
    } else {
      const channel = inputs.channel_id ?? await resolveGeneralChannel(client);
      if (!channel) {
        return { error: "Could not resolve the #general channel to post to." };
      }
      await client.chat.postMessage({ channel, text: leaderboard });
    }

    return { outputs: { leaderboard } };
  },
);
