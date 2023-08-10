import { type Strago } from '../interfaces/Strago'

import { ChannelType, type Message } from 'discord.js'

/**
 * Publishes any announcements that are sent on the server.
 * @param message the message that triggered the event
 * @param strago Strago client instance
 */
export const publishAnnouncement = async (message: Message, strago: Strago): Promise<void> => {
  if (message.channel.type !== ChannelType.GuildAnnouncement) return
  const channelName = message.channel.name
  message.crosspost()
    .then(() => strago.logger.info(`Crossposted message from channel: ${channelName}`))
    .catch(strago.logger.error)
}
