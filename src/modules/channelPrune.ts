import { ChannelType, type Message } from 'discord.js'

import { TWO_WEEKS_MS } from '../constants/time'
import type { Strago } from '../interfaces/Strago'

export const channelPrune = async (strago: Strago): Promise<void> => {
  // Only prune from home guild.
  const guild = strago.guilds.cache.get(strago.config.homeGuildId)
  if (guild === undefined) return
  const now = Date.now()
  const toDelete: Message[] = []
  // Iterate over channels, find all unpinned messages older than two weeks.
  for (const channelId of strago.config.pruneChannels) {
    await guild.channels.fetch(channelId).then(async (channel) => {
      if (channel === null || channel.type !== ChannelType.GuildText) return
      const messages = await channel.messages.fetch()
      for (const message of messages.values()) {
        if (!message.pinned && now - message.createdTimestamp > TWO_WEEKS_MS) {
          toDelete.push(message)
        }
      }
    })
  }
  // Prune messages older than two weeks.
  toDelete.sort((message) => message.createdTimestamp)
  await Promise.all(toDelete.map(async (message) => await message.delete()))
  if (toDelete.length > 0)
    strago.logger.info(`Pruned ${toDelete.length} messages.`)
}
