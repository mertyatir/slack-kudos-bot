import { Manifest } from "deno-slack-sdk/mod.ts";
import KudosWorkflow from "./workflows/kudos_workflow.ts";
import LeaderboardWorkflow from "./workflows/leaderboard_workflow.ts";
import KudosDatastore from "./datastores/kudos_datastore.ts";

export default Manifest({
  name: "Kudos Bot",
  description: "Recognize your teammates with kudos and track weekly + all-time leaderboards",
  icon: "assets/kudos_icon.png",
  workflows: [KudosWorkflow, LeaderboardWorkflow],
  outgoingDomains: [],
  datastores: [KudosDatastore],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
