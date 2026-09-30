import { type Message } from 'discord.js'

import { MORBLA_EMOJI } from '../constants/bot'
import Stats from '../interfaces/models/Stats'
import type { Strago } from '../interfaces/Strago'
import { kickAndPurge } from '../utils/kickAndPurge'

/**
 * Kicks anyone who posts in the honeypot channel and deletes their last hour of messages.
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
  await kickAndPurge(member, 'User sent message to honeypot channel.')
  const stats = await Stats.findOneAndUpdate(
    {},
    { $inc: { honeypotKills: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
  await message.channel.send(
    `${MORBLA_EMOJI} Caught ${member.displayName} (${member.user.username} <${member.user.id}>) sticking their hand in the honeypot! Total honeypot kills: ${stats.honeypotKills} ${MORBLA_EMOJI}`,
  )
  strago.logger.info(
    `Kicked ${member.user.username} for sending message to honeypot channel.`,
  )
}
