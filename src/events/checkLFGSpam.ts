import {
  ChannelType,
  type Message,
  PermissionFlagsBits,
  type TextChannel,
} from 'discord.js'

import User from '../interfaces/models/User'
import type { Strago } from '../interfaces/Strago'

const timeoutDuration = 60 * 60 * 1000

/**
 * Times out users who ping roles in multiple LFG channels in quick succession.
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
    !message.channel.name.endsWith('lfg')
  )
    return
  const member = message.member
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return

  // Check if roles were actually mentioned.
  if (message.mentions.roles.size > 0) {
    if (strago.lfgSpamSet.has(member.id)) {
      const user = await User.findOneAndUpdate(
        { discordId: member.id },
        { $setOnInsert: { discordId: member.id } },
        { new: true, setDefaultsOnInsert: true, upsert: true },
      )
      await user.updateOne(
        { discordId: member.id },
        { $inc: { numTimeouts: 1 } },
      )
      await user.save()
      const numTimeouts = user.numTimeouts + 1
      if (numTimeouts > 1) {
        const modChannel = strago.channels.cache.get(
          strago.config.modChannelId,
        ) as TextChannel
        await modChannel.send(
          `Timed out ${member.toString()}, they have been timed out ${numTimeouts} times.`,
        )
      }
      await message.reply(
        `${member.toString()}: pinging roles in multiple LFG channels spams people who might be in those channels. You have been timed out for one hour.\n` +
          '_Posting_ in multiple channels is fine as long as you do _not_ ping in multiple channels.',
      )
      await message.delete()
      await member.timeout(timeoutDuration, 'Spamming LFG channels with pings.')
      if (member.nickname !== null) {
        strago.logger.info(`Timed out ${member.toString()} for spamming LFG.`)
      }
    } else {
      strago.lfgSpamSet.add(member.id)
    }
  }
}
