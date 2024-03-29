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
- `/spell [name]`: returns info about a given Blue Mage spell
- `/[type] [topic]`: returns a shortcut previously saved under the `type` category
- `/weeklytargets [weeks]`: returns weekly target info for current week or the week `weeks` away

## Moderator commands
- `/bulkban [prefix]`: bans all users whose name starts with a given prefix
- `/recreaterole [id]`: recreates a specified role, effectively removing it from all users
- `/shortcuts [type] set [topic] [messageId]`: stores the content of a specified message for later retrieval

## Moderation features
- **User pruning**: kicks all users who have not completed verification and joined more than ten minutes ago

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
Configuration is stored in `.env`. Eventually this will be more convenient to use rather than having to swap around hardcoded strings in the actual code.

The following values are required:

|Value           |Description|
|----------------|----------------------------------------------------------|
|`BOT_TOKEN`     |Discord bot API token.                                    |
|`CLIENT_ID`     |The bot application ID.                                   |
|`NODE_ENV`      |The environment in which the bot is running (e.g. `prod`).|
|`HOME_GUILD_ID` |The ID of the home guild in which the bot is running.     |
|`PRUNE_CHANNELS`|Comma-separated list of channel IDs to prune.             |

### Data
Any data, static or otherwise, exists inside `./data`.

The bot expects a MongoDB instance running at `DATABASE_URI` specified in. There should be two databases: `prod` and `dev`. Currently there is just a single collection in each `characters` which stores `discordId`, `characterId` (from Lodestone), and `characterName`.

## Contributing
I'm happy to help any folks out who want to contribute here (even with minimal experience). Just ping me in Discord first so I have some idea of what to expect and we can figure out where to go from there.
