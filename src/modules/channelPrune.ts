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
      // Page through the whole channel, 100 messages at a time (the API maximum).
      let before: string | undefined
      for (;;) {
        const messages = await channel.messages.fetch({ limit: 100, before })
        for (const message of messages.values()) {
          if (
            !message.pinned &&
            now - message.createdTimestamp > TWO_WEEKS_MS
          ) {
            toDelete.push(message)
          }
        }
        if (messages.size < 100) break
        before = messages.lastKey()
      }
    })
  }
  // Prune messages older than two weeks.
  await Promise.all(
    toDelete.map((message) =>
      message.delete().catch((err) => strago.logger.error(err)),
    ),
  )
  if (toDelete.length > 0)
    strago.logger.info(`Pruned ${toDelete.length} messages.`)
}
