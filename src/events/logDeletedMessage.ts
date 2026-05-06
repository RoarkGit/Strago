import {
  ChannelType,
  Colors,
  EmbedBuilder,
  type Message,
  type PartialMessage,
} from 'discord.js'

import type { Strago } from '../interfaces/Strago'

export const logDeletedMessage = async (
  message: Message | PartialMessage,
  strago: Strago,
): Promise<void> => {
  if (
    strago.config.deletedMessagesChannelId === undefined ||
    message.channel.type !== ChannelType.GuildText ||
    message.channel.parentId === strago.config.modCategoryId ||
    message.content === null ||
    message.author === null
  )
    return

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
    .setFooter(
      attachments.size > 0
        ? {
            text: `Attachments were deleted with this message, attempting to upload below, Message ID: ${message.id}`,
          }
        : { text: `Message ID: ${message.id}` },
    )

  const ch = await strago.channels
    .fetch(strago.config.deletedMessagesChannelId)
    .catch((err) => {
      strago.logger.error(err)
      return null
    })
  if (ch === null || !ch.isSendable()) return

  await ch.send({ embeds: [embed] }).catch((err) => strago.logger.error(err))

  if (attachments.size > 0) {
    await ch
      .send({
        files: attachments.map((a) => ({
          name: `SPOILER_${a.name}`,
          attachment: a.url,
        })),
      })
      .catch((err) => strago.logger.error(err))
  }
}
