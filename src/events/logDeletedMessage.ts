import {
  ChannelType,
  Colors,
  EmbedBuilder,
  Message,
  PartialMessage,
} from 'discord.js'

import { Strago } from '../interfaces/Strago'

/**
 * Logs a message when it has been deleted.
 * @param message the message being deleted
 * @param strago Strago client instance
 */
export const logDeletedMessage = async (
  message: Message | PartialMessage,
  strago: Strago,
) => {
  if (
    message.channel.type === ChannelType.GuildText &&
    message.channel.parentId !== strago.config.modCategoryId &&
    message.content !== null &&
    message.author !== null
  ) {
    const avatarUrl = message.author.avatarURL()
    const attachments = message.attachments
    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setAuthor({
        name: message.author.username,
        ...(avatarUrl && { iconURL: avatarUrl }),
      })
      .setDescription(
        `**Message sent by ${message.author} in ${message.channel} has been deleted.**\n${message.content}`,
      )
    if (attachments.size > 0) {
      embed.setFooter({
        text: `Attachments were deleted with this message, attempting to upload below, Message ID: ${message.id}`,
      })
    } else {
      embed.setFooter({ text: `Message ID: ${message.id}` })
    }
    strago.channels.fetch(strago.config.deletedMessagesChannelId).then((ch) => {
      if (ch === null || !ch.isTextBased()) return
      ch.send({ embeds: [embed] }).catch((err) => strago.logger.error(err))
      if (attachments.size > 0) {
        ch.send({
          files: message.attachments.map((attachment) => ({
            name: 'SPOILER_' + attachment.name,
            attachment: attachment.url,
          })),
        }).catch((err) => strago.logger.error(err))
      }
    })
  }
}
