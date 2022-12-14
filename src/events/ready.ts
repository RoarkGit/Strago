import { Strago } from '../interfaces/Strago'

import { channelPrune } from '../modules/channelPrune'
import { userPrune } from '../modules/userPrune'

const userPruneLoop = (strago: Strago): void => {
  (async (): Promise<void> => await userPrune(strago))().catch(error => strago.logger.error(error))
  setTimeout(userPruneLoop, 1000 * 60, strago)
}

const channelPruneLoop = (strago: Strago): void => {
  (async (): Promise<void> => await channelPrune(strago))().catch(error => strago.logger.error(error))
  setTimeout(channelPruneLoop, 1000 * 60 * 10, strago)
}

/**
 * Prints message when bot is connected and ready.
 * @param strago Strago client instance
 */
export const ready = async (strago: Strago): Promise<void> => {
  strago.logger.info('Discord ready!')
  const guildList = strago.guilds.cache
  const guildNames = guildList.map(g => ({ guildName: g.name, guildId: g.id }))
  const logMessage = {
    message: `Connected to ${guildList.size} servers.`,
    guilds: guildNames
  }
  strago.logger.info(logMessage)
  channelPruneLoop(strago)
  userPruneLoop(strago)
}
