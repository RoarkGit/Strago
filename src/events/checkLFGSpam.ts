import { Strago } from '../interfaces/Strago'

import { ChannelType, Message } from 'discord.js'

const slowmodeDuration = 5 * 60 * 1000

/**
 * Times out users who ping roles in multiple LFG channels in quick succession.
 * @param message the message that triggered the event
 * @param strago Strago client instance
 */
export const checkLFGSpam = async (message: Message, strago: Strago): Promise<void> => {
  if (message.channel.type !== ChannelType.GuildText || message.member === null || !message.channel.name.endsWith('lfg')) return
  const member = message.member

  // Check if roles were actually mentioned.
  if (message.mentions.roles.size > 0) {
    if (strago.lfgSpamSet.has(member.id)) {
      await message.reply('Pinging roles in multiple LFG channels spams people who might be in those channels. You have been timed out for one hour.\n' +
                          '_Posting_ in multiple channels is fine as long as you do _not_ ping in multiple channels.')
      await message.member.timeout(300, 'Spamming LFG channels with pings.')
      if (member.nickname !== null) {
        strago.logger.info(`Timed out ${member.nickname} for spamming LFG.`)
      }
    } else {
      // Add member to map, but remove them after the slowmode timer would have expired.
      strago.lfgSpamSet.add(member.id)
      setTimeout(() => strago.lfgSpamSet.delete(member.id), slowmodeDuration)
    }
  }
}
