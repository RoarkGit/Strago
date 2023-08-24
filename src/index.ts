import { join } from 'path'

import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js'

import { handleEvents } from './events/handleEvents'
import type { Spell } from './interfaces/Spell'
import type { Strago } from './interfaces/Strago'
import { TimeoutSet } from './interfaces/TimeoutSet'
import { validateEnv } from './modules/validateEnv'
import { connectDatabase } from './utils/connectDatabase'
import { initLogger } from './utils/initLogger'
import { loadCommands } from './utils/loadCommands'
import { loadSpells } from './utils/loadSpells'
import { registerCommands } from './utils/registerCommands'

/**
 * Main entry point for Strago.
 */
void (async () => {
  const strago = new Client({
    intents:
      GatewayIntentBits.Guilds |
      GatewayIntentBits.GuildMembers |
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.MessageContent,
    partials: [
      Partials.GuildMember
    ],
  }) as Strago

  // Validate and load environment variables.
  const validatedEnvironment = validateEnv(strago)
  if (!validatedEnvironment.valid) {
    console.error(validatedEnvironment.message)
    return
  }

  // Initialize logger.
  await initLogger(strago)

  // Connect to the database.
  if (!(await connectDatabase(strago))) {
    strago.logger.error('Failed to connect to database.')
    return
  }

  // Load static data.
  strago.data = {
    spellData: new Collection<string, Spell>(),
  }

  if (!(await loadSpells(strago))) {
    strago.logger.error('Failed to load spells.')
    return
  }

  // Load commands.
  strago.shortcutTitles = new Collection<string, Set<string>>()
  const commandsPath =
    strago.config.env === 'prod'
      ? join(process.cwd(), 'prod', 'commands')
      : join(process.cwd(), 'src', 'commands')
  if (!(await loadCommands(strago, commandsPath))) {
    strago.logger.error('Failed to load commands.')
    return
  }

  // Register commands.
  strago.logger.info('Registering commands.')
  if (!(await registerCommands(strago))) {
    strago.logger.error('Failed to register commands.')
    return
  }

  // Instantiate values.
  strago.lfgSpamSet = new TimeoutSet(5 * 60)
  strago.grantSpamSet = new TimeoutSet(10 * 60)

  // Load event handlers.
  handleEvents(strago)

  await strago.login(strago.config.token)
})()
