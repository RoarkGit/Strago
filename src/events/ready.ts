import { CronJob } from 'cron'
import {
  GuildTextBasedChannel,
  PermissionsBitField,
  type TextChannel,
} from 'discord.js'

import { ONE_WEEK_MS } from '../constants/time'
import type { Strago } from '../interfaces/Strago'
import { channelPrune } from '../modules/channelPrune'
import { generateWeeklyTargetsEmbed } from '../modules/weeklyTargets'

// Populates Discord.js message cache so logDeletedMessage can log message content on delete.
const cacheRecentMessages = async (
  channel: GuildTextBasedChannel,
  cutoff: Date,
) => {
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
  const lastWeekDate = new Date(Date.now() - ONE_WEEK_MS)
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
      cacheRecentMessages(c, lastWeekDate).catch((err) =>
        strago.logger.error(err),
      )
    })
  })

  // Every 10 minutes: prune inactive fill channels.
  const channelPruneCron = new CronJob(
    '0 */10 * * * *',
    () => {
      channelPrune(strago).catch((err) => strago.logger.error(err))
    },
    null,
    false,
    'Etc/UTC',
  )
  channelPruneCron.start()

  if (strago.config.weeklyTargetChannelId !== undefined) {
    // Every Tuesday at 8:00 UTC: post fresh weekly targets.
    const weeklyTargetsCron = new CronJob(
      '0 0 8 * * 2',
      () => {
        const channel = strago.channels.cache.get(
          strago.config.weeklyTargetChannelId as string,
        ) as TextChannel
        channel.messages.fetch().then((messages) =>
          messages.forEach((m) => {
            if (!m.pinned) {
              m.delete().catch((err) => strago.logger.error(err))
            }
          }),
        )
        const embed = generateWeeklyTargetsEmbed(strago.data.weeklyTargets, 0)
        channel
          .send({ embeds: [embed] })
          .then((m) => m.crosspost())
          .catch((err) => strago.logger.error(err))
      },
      null,
      false,
      'Etc/UTC',
    )
    weeklyTargetsCron.start()
  }
}
