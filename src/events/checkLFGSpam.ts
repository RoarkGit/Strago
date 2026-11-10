import { ChannelType, type Message, PermissionFlagsBits } from 'discord.js'

import { LFG_SPAM_TIMEOUT_S, ONE_HOUR_MS } from '../constants/time'
import User from '../interfaces/models/User'
import type { Strago } from '../interfaces/Strago'

/**
 * Times out users who ping roles in LFG more than once within the spam window.
 * @param message the message that triggered the event
 * @param strago Strago client instance
 */
export const checkLFGSpam = async (
  message: Message,
  strago: Strago,
): Promise<void> => {
  if (
    message.channel.type !== ChannelType.GuildText ||
    message.member === null ||
    !message.channel.name.endsWith('lfg') ||
    strago.config.lfgCategoryId === undefined
  )
    return
  const member = message.member
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return

  // Check if roles were actually mentioned.
  if (message.mentions.roles.size > 0) {
    if (strago.lfgSpamSet.has(member.id)) {
      const user = await User.findOneAndUpdate(
        { discordId: member.id },
        { $inc: { numTimeouts: 1 } },
        { returnDocument: 'after', setDefaultsOnInsert: true, upsert: true },
      )
      const numTimeouts = user.numTimeouts
      if (numTimeouts > 1) {
        const modChannel = await strago.channels.fetch(
          strago.config.modChannelId,
        )
        if (modChannel !== null && modChannel.isSendable()) {
          await modChannel.send(
            `Timed out ${member.toString()}, they have been timed out ${numTimeouts} times.`,
          )
        }
      }
      await message.reply(
        `${member.toString()}: pinging roles more than once every ${LFG_SPAM_TIMEOUT_S / 60} minutes spams everyone with those roles. You have been timed out for one hour.\n` +
          'Please give people time to respond before pinging again.',
      )
      await message.delete()
      await member.timeout(ONE_HOUR_MS, 'Spamming LFG with pings.')
      if (member.nickname !== null) {
        strago.logger.info(`Timed out ${member.toString()} for spamming LFG.`)
      }
    } else {
      strago.lfgSpamSet.add(member.id)
    }
  }
}
