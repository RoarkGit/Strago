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
- `/register [character] [server]`: register a character to a Discord user

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

|Value          |Description|
|---------------|----------------------------------------------------------|
|`BOT_TOKEN`    |Discord bot API token.                                    |
|`CLIENT_ID`    |The bot application ID.                                   |
|`NODE_ENV`     |The environment in which the bot is running (e.g. `prod`).|
|`TEST_GUILD_ID`|The ID of the guild used for testing.                     |

### Data
Any data, static or otherwise, exists inside `./data`.

The bot expects a SQLite database located at `./data/storage.db`. Currently there is just a single table `Characters` which stores `discordId`, `characterId` (from Lodestone), and `characterName`.

## Contributing
I'm happy to help any folks out who want to contribute here (even with minimal experience). Just ping me in Discord first so I have some idea of what to expect and we can figure out where to go from there.