import { ChannelType, type Message } from 'discord.js'

import type { Strago } from '../interfaces/Strago'

export const publishAnnouncement = async (
  message: Message,
  strago: Strago,
): Promise<void> => {
  if (message.channel.type !== ChannelType.GuildAnnouncement) return
  const channelName = message.channel.name
  await message
    .crosspost()
    .then(() =>
      strago.logger.info(`Crossposted message from channel: ${channelName}`),
    )
    .catch(strago.logger.error)
}
