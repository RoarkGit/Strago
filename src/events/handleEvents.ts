import { checkChannelSpam } from './checkChannelSpam'
import { checkHoneypot } from './checkHoneypot'
import { checkLFGSpam } from './checkLFGSpam'
import { interactionCreate } from './interactionCreate'
import { kickOnBotRole } from './kickOnBotRole'
import { logDeletedMessage } from './logDeletedMessage'
import { publishAnnouncement } from './publishAnnouncement'
import { ready } from './ready'
import type { Strago } from '../interfaces/Strago'

/**
 * Loads event handlers for Strago.
 * @param strago Strago client instance
 */
export const handleEvents = (strago: Strago): void => {
  // Logs a handler's error instead of letting it reject, so one failing handler doesn't skip the rest.
  const safely = (handler: Promise<void>): Promise<void> =>
    handler.catch((err) => {
      strago.logger.error(err)
    })

  strago.on('clientReady', async () => {
    await safely(ready(strago))
  })

  strago.on('interactionCreate', async (interaction) => {
    await safely(interactionCreate(interaction, strago))
  })

  strago.on('messageCreate', async (message) => {
    await safely(checkLFGSpam(message, strago))
    await safely(publishAnnouncement(message, strago))
    await safely(checkHoneypot(message, strago))
    await safely(checkChannelSpam(message, strago))
  })

  strago.on('messageDelete', async (message) => {
    if (strago.config.deletedMessagesChannelId) {
      await safely(logDeletedMessage(message, strago))
    }
  })

  strago.on('guildMemberUpdate', async (_, member) => {
    await safely(kickOnBotRole(member, strago))
  })

  process.on('uncaughtException', (error) => {
    strago.logger.error(error)
  })
}
