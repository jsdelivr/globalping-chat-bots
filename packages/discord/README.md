## discord-bot

Discord bot using the Discord.js framework.

## Setup

1. Follow the steps specified in the [Discord.js guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) to setup your own [bot application](https://discord.com/developers/applications).
2. Ensure you have the Application ID and Bot Token which can be found in the General Information and Bot tabs of the Discord Developer Portal respectively. This will map to your environment variables `DISCORD_APP_ID` and `DISCORD_TOKEN`.
3. Run `pnpm deploy-commands` only once after registering your Discord application. This registers the `/globalping` command to Discord globally. You do not need to rerun this command unless changes are made to `src/deploy-commands.ts`.
4. Once ready, head over to your [app configuration](https://discord.com/developers/applications) and generate an invite URL under the **OAuth2** tab. You will only need to select the `applications.commands` and `bot` permission.
5. The `bot` permission will open another tab of permissions, where you only need to enable the following permissions:
   1. Read Messages/View Channels
   2. Send Messages
   3. Create Public Threads
   4. Create Private Threads
   5. Send Messages in Threads
   6. Manage Messages
   7. Add Reactions
   8. Use Slash Commands

Some of these permissions are unused, but may be introduced in a future update of the bot. You now have an invite link for the bot.
