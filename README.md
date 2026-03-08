# Kudos Bot

A Slack app built with the [Deno Slack SDK](https://api.slack.com/automation) that lets teammates recognize each other with kudos and track weekly and all-time leaderboards.

## Features

- **Give Kudos** — Open a form to pick a teammate and write why they're awesome. The kudos is posted to the channel for everyone to see.
- **Leaderboard** — View weekly and all-time kudos leaderboards (shown as an ephemeral message, visible only to you).

## Prerequisites

- A Slack workspace on a [paid plan](https://slack.com/pricing)
- [Slack CLI](https://api.slack.com/automation/quickstart) installed and authenticated

## Setup

```zsh
# Clone the repo
git clone <repo-url> kudos-bot
cd kudos-bot

# Run the app locally
slack run
```

On the first run, the CLI will prompt you to create triggers from the `triggers/` directory. Select your workspace and create both:

- **Give Kudos** — shortcut link trigger to open the kudos form
- **Leaderboard** — shortcut link trigger to show the leaderboard

Paste the generated shortcut URLs into a channel or add them as bookmarks.

### Adding triggers manually

```zsh
slack trigger create --trigger-def triggers/kudos_trigger.ts
slack trigger create --trigger-def triggers/leaderboard_trigger.ts
```

## Deploying

```zsh
slack deploy
```

You'll need to create new triggers for the deployed version (triggers are separate for local vs deployed).

## Project Structure

```
manifest.ts              # App config (name, scopes, workflows, datastores)
datastores/
  kudos_datastore.ts     # Stores kudos entries (giver, receiver, message, timestamp)
functions/
  give_kudos.ts          # Saves kudos to datastore and posts to channel
  show_leaderboard.ts    # Queries datastore and shows weekly + all-time rankings
workflows/
  kudos_workflow.ts      # Opens form -> calls give_kudos function
  leaderboard_workflow.ts # Calls show_leaderboard function
triggers/
  kudos_trigger.ts       # Link shortcut trigger for giving kudos
  leaderboard_trigger.ts # Link shortcut trigger for viewing leaderboard
```

## Testing

```zsh
deno task test
```

## Viewing Logs

```zsh
slack activity --tail
```
