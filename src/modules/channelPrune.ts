import { ChannelType, Message } from 'discord.js'

import { Strago } from '../interfaces/Strago'

/**
 * Prunes messages more than two weeks old from specified channels.
 */
export const channelPrune = async (strago: Strago): Promise<void> => {
  // Only prune from home guild.
  const guild = strago.guilds.cache.get(strago.config.homeGuildId)
  if (guild === undefined) return
  strago.logger.info('Beginning channel prune.')
  const now = Date.now()
  const twoWeeksMs = 1000 * 60 * 60 * 24 * 14
  const toDelete: Message[] = []
  // Iterate over channels, find all unpinned messages older than two weeks.
  for (const channelId of strago.config.pruneChannels) {
    await guild.channels.fetch(channelId).then(
      async channel => {
        if (channel?.type !== ChannelType.GuildText) return
        const messages = await channel.messages.fetch()
        for (const message of messages.values()) {
          if (!message.pinned && now - message.createdTimestamp > twoWeeksMs) {
            toDelete.push(message)
          }
        }
      }
    )
  }
  // Prune messages older than two weeks.
  toDelete.sort(message => message.createdTimestamp)
  await Promise.all(toDelete.map(async message => await message.delete()))
  strago.logger.info(`Pruned ${toDelete.length} messages.`)
}
