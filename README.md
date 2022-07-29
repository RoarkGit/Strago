<h1 align="center">Strago</h1>
<img src="https://static.wikia.nocookie.net/finalfantasy/images/4/40/FFVI_Strago_Magus_Menu_iOS.png/revision/latest?cb=20140219011107" style="display: block; margin: auto; padding: 10px">
<p align="center">
<a href="https://discord.gg/blueacademy"><img alt="Discord Server" src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white"></a>
</p>
<h3 align="center">A (simple) bot for running various functions for Blue Academy.</h3>

---

## Development Requirements
- [discord.js](https://github.com/discordjs/discord.js)
- `applications.commands` scope enabled for bot (to use Slash commands)

## Supported commands
- `/grant`: run workflow for granting roles based on character achievements
- `/register [character] [server]`: register a character to a Discord user

## Technical Information

### Commands
Commands are implemented using [command handlers](https://discordjs.guide/creating-your-bot/command-handling.html) and stored in `./commands`.

### Events
Events are implemented using [event handlers](https://discordjs.guide/creating-your-bot/event-handling.html) and stored in `./events`

### Helper Libraries
Helper libraries, such as `xivlib.js` for scraping Lodestone, are stored in `./libs`.

### Configuration
Configuration is stored in `./config-prod.json` and `./config-dev.json`. Eventually this will be more convenient to use rather than having to swap around hardcoded strings in the actual code.

### Data
Any data, static or otherwise, exists inside `./data`.

The bot expects a SQLite database located at `./data/storage.db`. Currently there is just a single table which stores `discordId`, `characterId` (from Lodestone), and `characterName`.

## Contributing
I'm happy to help any folks out who want to contribute here (even with minimal experience). Just ping me in Discord first so I have some idea of what to expect and we can figure out where to go from there.