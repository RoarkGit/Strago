<h1 align="center">Strago</h1>
<p align="center">
<img src="https://static.wikia.nocookie.net/finalfantasy/images/4/40/FFVI_Strago_Magus_Menu_iOS.png/revision/latest?cb=20140219011107"></br>
<a href="https://discord.gg/blueacademy"><img alt="Discord Server" src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white"></a>
</p>
<h3 align="center">A (simple) bot for running various functions for Blue Academy.</h3>

---

## Development Requirements
- [discord.js](https://github.com/discordjs/discord.js)
- `applications.commands` scope enabled for bot (to use Slash commands)
- TypeScript

## Supported commands
- `/grant`: run workflow for granting roles based on character achievements
- `/register [character] [server] [id]`: register a character to a Discord user using character info or ID
- `/spell [name]` / `/spelllore [name]`: returns info or lore about a given Blue Mage spell
- `/beast [name] [rank]` / `/beastlore [name]`: returns info (with stats at a given rank) or lore about a given Beastmaster beast
- `/beastitem [name]`: returns info about a Beastmaster item (Beast Gear, Crucible Item, or Feed)
- `/weeklytargets [weeks]`: returns weekly target info for current week or the week `weeks` away
- `/fill on|off|roles|find`: toggles fill notifications, configures fill roles, or requests a fill from an LFG channel
- `/botkills`: shows how many bots the honeypot, bot trap role, and channel spam check have caught
- `/[type] [title]`: returns a shortcut previously saved under the `type` category

## Moderator commands
- `/bulkban [prefix]`: bans all users whose name starts with a given prefix
- `/purgerole [id]`: removes a specified role from all members
- `/shortcuts [type] set [title] [message_id]`: stores the content of a specified message for later retrieval
- `/shortcuts [type] delete [title]`: deletes a stored shortcut

## Moderation features
- **Honeypot**: kicks anyone who posts in the honeypot channel and deletes their last hour of messages
- **Bot trap role**: kicks anyone who gives themselves the `Bot Trap` role
- **LFG ping spam**: times out users who ping roles in more than one LFG channel within five minutes
- **Channel spam**: kicks users who post the same message in three or more channels (text or voice) within 20 seconds and deletes their last hour of messages
- **Deleted message log**: reposts deleted messages (and their attachments) from text and voice channels to a log channel

## Automated tasks
- **Announcement crossposting**: publishes every message posted in announcement channels
- **Weekly targets**: posts the new weekly targets every Tuesday at 8:00 UTC
- **Channel pruning**: every ten minutes, deletes unpinned messages older than two weeks from the configured prune channels

## Technical Information

### Commands
Commands are implemented using [command handlers](https://discordjs.guide/creating-your-bot/command-handling.html) and stored in `./commands`.

### Events
Events are implemented using [event handlers](https://discordjs.guide/creating-your-bot/event-handling.html) and stored in `./events`

### Helper Modules
Helper modules, such as `xivlib.js` for scraping Lodestone, are stored in `./modules`.

### Bot Utilities
Bot utilities, such as those for loading and registering commands, are stored in `./utils`.

### Configuration
Configuration is stored in `.env.dev` / `.env.prod`.

The following values are required:

|Value            |Description|
|-----------------|----------------------------------------------------------|
|`BOT_TOKEN`      |Discord bot API token.                                    |
|`CLIENT_ID`      |The bot application ID.                                   |
|`NODE_ENV`       |The environment in which the bot is running (e.g. `prod`).|
|`HOME_GUILD_ID`  |The ID of the home guild in which the bot is running.     |
|`MOD_CATEGORY_ID`|The ID of the moderator channel category.                 |
|`MOD_CHANNEL_ID` |The ID of the moderator channel.                          |
|`DATABASE_URI`   |URI of MongoDB instance where data is stored.             |

The following values are optional; the related feature is disabled (or falls back as noted) when unset:

|Value                        |Description|
|-----------------------------|----------------------------------------------------------------|
|`DELETED_MESSAGES_CHANNEL_ID`|Channel where deleted messages are logged.                      |
|`FILL_CHANNEL_ID`            |Channel where `/fill find` requests are posted.                 |
|`HONEYPOT_CHANNEL_ID`        |The honeypot channel.                                           |
|`LFG_CATEGORY_ID`            |The LFG channel category (used by `/fill find` and spam checks).|
|`LOKI_URI`                   |Loki endpoint for shipping logs.                                |
|`PRUNE_CHANNELS`             |Comma-separated channel IDs to prune.                           |
|`SHORTCUT_TYPES`             |Comma-separated shortcut categories (e.g. `faqs,memes`).        |
|`SPAM_DETECTION_CHANNEL_ID`  |Where channel spam kicks are reported (defaults to `MOD_CHANNEL_ID`).|
|`WEEKLY_TARGET_CHANNEL_ID`   |Channel where weekly targets are posted.                        |

### Data
Static data lives in `./src/data`, including the [Limited-Job-Data](https://github.com/RoarkGit/Limited-Job-Data) submodule for spells, beasts, items, and weekly targets.

The bot expects a MongoDB instance running at `DATABASE_URI`, with collections for registered characters (`characters`), fill preferences (`fills`), LFG timeout counts (`users`), bot trap kill counts (`stats`), and one collection per shortcut type (files are stored in GridFS).

## Contributing
I'm happy to help any folks out who want to contribute here (even with minimal experience). Just ping me in Discord first so I have some idea of what to expect and we can figure out where to go from there.
