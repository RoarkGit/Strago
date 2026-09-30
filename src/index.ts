import { join, resolve } from 'path'

import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js'

import {
  FILL_SPAM_TIMEOUT_S,
  GRANT_SPAM_TIMEOUT_S,
  LFG_SPAM_TIMEOUT_S,
} from './constants/time'
import { handleEvents } from './events/handleEvents'
import type { Beast } from './interfaces/Beast'
import type { Item } from './interfaces/Item'
import type { Spell } from './interfaces/Spell'
import type { Strago } from './interfaces/Strago'
import { TimeoutSet } from './interfaces/TimeoutSet'
import { validateEnv } from './modules/validateEnv'
import { connectDatabase } from './utils/connectDatabase'
import { initLogger } from './utils/initLogger'
import { loadByName } from './utils/loadByName'
import { loadCommands } from './utils/loadCommands'
import { loadEmoji } from './utils/loadEmoji'
import { loadWeeklyTargets } from './utils/loadWeeklyTargets'
import { PATHS } from './utils/paths'
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
    partials: [Partials.GuildMember, Partials.Message],
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
  const spellData = loadByName<Spell>(strago, PATHS.spellData())
  const beastData = loadByName<Beast>(strago, PATHS.beastData())
  const itemData = loadByName<Item>(strago, PATHS.itemData())
  if (spellData === null || beastData === null || itemData === null) {
    strago.logger.error('Failed to load static data.')
    return
  }
  strago.data = {
    beastData,
    itemData,
    emoji: new Collection<string, string>(),
    spellData,
    weeklyTargets: { carnivale: {}, duties: {}, primes: {} },
  }

  await loadEmoji(strago)

  if (!loadWeeklyTargets(strago)) {
    strago.logger.error('Failed to load weekly targets.')
    return
  }

  // Load commands.
  strago.shortcutTitles = new Collection<string, Set<string>>()
  const commandsPath = join(resolve(__dirname), 'commands')
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
  strago.fillSpamSet = new TimeoutSet(FILL_SPAM_TIMEOUT_S)
  strago.lfgSpamSet = new TimeoutSet(LFG_SPAM_TIMEOUT_S)
  strago.grantSpamSet = new TimeoutSet(GRANT_SPAM_TIMEOUT_S)

  // Load event handlers.
  handleEvents(strago)

  await strago.login(strago.config.token)
})()
