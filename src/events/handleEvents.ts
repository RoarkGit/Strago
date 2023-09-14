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

    // TODO: Remove after deleting filler roles.
    if (
      message.channel.isTextBased() &&
      !message.channel.isDMBased() &&
      message.channel.id !== strago.config.fillChannelId &&
      message.channel.parentId === strago.config.lfgCategoryId &&
      message.mentions.roles.some((r) => r.name.includes('Filler'))
    ) {
      await message.reply({
        content:
          "It looks like you're looking for a fill! Try using `/fill find` instead. Filler roles are going to be removed in the future, see here for more info: https://discord.com/channels/762797677133561887/1150923406380900382",
      })
    }
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
