import { CronJob } from 'cron'
import {
  GuildTextBasedChannel,
  PermissionsBitField,
  type TextChannel,
} from 'discord.js'

import type { Strago } from '../interfaces/Strago'
import { channelPrune } from '../modules/channelPrune'
import { generateWeeklyTargetsEmbed } from '../modules/weeklyTargets'

const fetchMessages = async (channel: GuildTextBasedChannel, cutoff: Date) => {
  let messages = await channel.messages.fetch({ limit: 100 })
  let lastMessage = messages.last()
  while (
    lastMessage !== undefined &&
    lastMessage.createdAt > cutoff &&
    messages.size === 100
  ) {
    messages = await channel.messages.fetch({
      limit: 100,
      before: lastMessage.id,
    })
    lastMessage = messages.last()
  }
}

/**
 * Prints message when bot is connected and ready.
 * @param strago Strago client instance
 */
export const ready = async (strago: Strago): Promise<void> => {
  strago.logger.info('Discord ready!')
  const guildList = strago.guilds.cache
  const guildNames = guildList.map((g) => ({
    guildName: g.name,
    guildId: g.id,
  }))
  strago.logger.info({
    message: `Connected to ${guildList.size} servers.`,
    guilds: guildNames,
  })
  const lastWeekDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  guildList.forEach((g) => {
    g.channels.cache.forEach((c) => {
      if (
        !c.isTextBased() ||
        c.parentId === strago.config.modCategoryId ||
        g.members.me === null ||
        !c
          .permissionsFor(g.members.me)
          .has(PermissionsBitField.Flags.ViewChannel)
      )
        return
      fetchMessages(c, lastWeekDate).catch((err) => strago.logger.error(err))
    })
  })
  // Start channel prune cron.
  const channelPruneCron = new CronJob({
    cronTime: '0 */10 * * * *',
    onTick: () => {
      channelPrune(strago).catch((err) => strago.logger.error(err))
    },
    timeZone: 'Etc/UTC',
  })
  channelPruneCron.start()
  // Start weekly targets cron.
  const weeklyTargetsCron = new CronJob({
    cronTime: '0 0 8 * * 2',
    onTick: () => {
      const channel = strago.channels.cache.get(
        strago.config.weeklyTargetChannelId,
      ) as TextChannel
      // Delete old messages
      channel.messages.fetch().then((messages) =>
        messages.forEach((m) => {
          if (!m.pinned) {
            m.delete().catch((err) => strago.logger.error(err))
          }
        }),
      )
      // Send new weekly message
      const embed = generateWeeklyTargetsEmbed(0)
      channel.send({ embeds: [embed] }).catch((err) => strago.logger.error(err))
    },
    timeZone: 'Etc/UTC',
  })
  weeklyTargetsCron.start()
}
