import type { Client, Collection } from 'discord.js'
import type { Db } from 'mongodb'
import type { Logger } from 'winston'

import type { Command } from './Command'
import type { Spell } from './Spell'
import type { TimeoutSet } from './TimeoutSet'

/**
 * Implementation of Discord client.
 */
export interface Strago extends Client {
  /**
   * Collection of Commands stored as name:Command pairs.
   */
  commands: Collection<string, Command>
  /**
   * Various config values.
   */
  config: {
    shortcutTypes: string[]
    databaseUri: string
    env: string
    id: string
    homeGuildId: string
    loggerUri: string | undefined
    modChannelId: string
    pruneChannels: string[]
    token: string
  }
  /**
   * Static data.
   */
  data: {
    spellData: Collection<string, Spell>
  }
  shortcutTitles: Collection<string, Set<string>>
  db: Db
  grantSpamSet: TimeoutSet
  lfgSpamSet: TimeoutSet
  logger: Logger
};
