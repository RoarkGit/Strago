import { Strago } from '../interfaces/Strago'


import { ChannelType, Message, TextChannel } from 'discord.js'

const timeoutDuration = 60 * 60 * 1000

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
      const users = strago.db.collection('users')
      const user = await users.findOne({
        discordId: member.id
      })
      if (user === null) {
        await users.insertOne({ discordId: member.id, numTimeouts: 1 })
      } else {
        await users.updateOne({ discordId: member.id }, {$inc: {numTimeouts: 1}})
        const numTimeouts = user.numTimeouts + 1
        await (strago.channels.cache.get(strago.config.modChannelId) as TextChannel).send(
          `Timed out ${member}, they have been timed out ${numTimeouts} times.`
        )
      }
      await message.reply(`${member}: pinging roles in multiple LFG channels spams people who might be in those channels. You have been timed out for one hour.\n` +
                          '_Posting_ in multiple channels is fine as long as you do _not_ ping in multiple channels.')
      await message.delete()
      await member.timeout(timeoutDuration, 'Spamming LFG channels with pings.')
      if (member.nickname !== null) {
        strago.logger.info(`Timed out ${member} for spamming LFG.`)
      }
    } else {
      strago.lfgSpamSet.add(member.id)
    }
  }
}
