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
  strago.on('ready', async () => {
    await ready(strago)
  })

  strago.on('interactionCreate', async (interaction) => {
    await interactionCreate(interaction, strago)
  })

  strago.on('messageCreate', async (message) => {
    await checkLFGSpam(message, strago)
    await publishAnnouncement(message, strago)
  })

  strago.on('messageDelete', async (message) => {
    await logDeletedMessage(message, strago)
  })

  strago.on('guildMemberUpdate', async (_, member) => {
    await kickOnBotRole(member, strago)
  })

  process.on('uncaughtException', (error) => {
    strago.logger.error(error)
  })
}
