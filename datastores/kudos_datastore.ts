import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

const KudosDatastore = DefineDatastore({
  name: "kudos",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    giver_id: { type: Schema.slack.types.user_id },
    receiver_id: { type: Schema.slack.types.user_id },
    message: { type: Schema.types.string },
    created_at: { type: Schema.types.string },
  },
});

export default KudosDatastore;
