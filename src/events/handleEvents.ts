import { Strago } from '../interfaces/Strago'

import { checkLFGSpam } from './checkLFGSpam'
import { interactionCreate } from './interactionCreate'
import { kickOnBotRole } from './kickOnBotRole'
import { publishAnnouncement } from './publishAnnouncement'
import { ready } from './ready'

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

  strago.on('guildMemberUpdate', async (_, member) => {
    await kickOnBotRole(member, strago)
  })

  strago.on('guildMemberAdd', (member) => {
    console.log(member)
  })

  process.on('uncaughtException', (error) => {
    strago.logger.error(error)
  })
}
