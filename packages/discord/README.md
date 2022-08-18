## discord-bot

Discord bot using the Discord.js framework.

## Setup

Follow the steps specified in the [Discord.js guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) to setup your own [bot application](https://discord.com/developers/applications).

Ensure you have the **Application ID** and **Bot Token** which can be found in the General Information and Bot tabs of the [Discord Developer Portal](https://discord.com/developers/applications) respectively.

You should have the following environment variables:

```
DISCORD_APP_ID=
DISCORD_TOKEN=
```

Run `pnpm deploy-commands` only once after registering your Discord application. This registers the `/globalping` command to Discord globally. You do not need to rerun this command unless changes are made to `src/deploy-commands.ts`.

Once ready, head over to your [app configuration](https://discord.com/developers/applications) and generate an invite URL under the **OAuth2** tab.

1. Select the `applications.commands` and `bot` permission.
2. The `bot` permission will open another tab of permissions, where you only need to enable the following permissions:
   1. Read Messages/View Channels
   2. Send Messages
   3. Create Public Threads
   4. Create Private Threads
   5. Send Messages in Threads
   6. Manage Messages
   7. Add Reactions
   8. Use Slash Commands

Some of these permissions are unused, but may be introduced in a future update of the bot. You now have an invite link for the bot.
