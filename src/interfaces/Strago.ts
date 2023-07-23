import { Client, Collection } from 'discord.js'
import { Logger } from 'winston'

import { Command } from './Command'
import { Spell } from './Spell'
import { TimeoutSet } from './TimeoutSet'

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
    achievementData: {
      achievementIds: {
        [key: string]: string
      }
      roles: Array<{
        name: string
        required: string[]
        blockedBy: string[]
      }>
    }
    spellData: Collection<string, Spell>
  }
  grantSpamSet: TimeoutSet
  lfgSpamSet: TimeoutSet
  logger: Logger
};
