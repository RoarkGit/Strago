import { type Message } from 'discord.js'

import type { Strago } from '../interfaces/Strago'

const MORBLA = '<:morbla:1066449552581865482>'

/**
 * Publishes any announcements that are sent on the server.
 * @param message the message that triggered the event
 * @param strago Strago client instance
 */
export const checkHoneypot = async (
  message: Message,
  strago: Strago,
): Promise<void> => {
  if (
    strago.config.honeypotChannelId === undefined ||
    strago.config.honeypotChannelId !== message.channelId ||
    !message.channel.isSendable() ||
    message.guild === null ||
    message.member === null ||
    message.author === strago.user
  )
    return
  const member = message.member
  await member.ban({
    deleteMessageSeconds: 60 * 60, // Delete last hour of messages
    reason: 'User sent message to honeypot channel.',
  })
  await message.guild.members.unban(member)
  await message.channel.send(
    `${MORBLA} Caught ${member.user.username} sticking their hand in the honeypot! ${MORBLA}`,
  )
  strago.logger.info(
    `Kicked ${member.user.username} for sending message to honeypot channel.`,
  )
}
