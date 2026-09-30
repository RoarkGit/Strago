import { CronJob } from 'cron'
import { GuildTextBasedChannel, PermissionsBitField } from 'discord.js'

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

// Posts the new weekly targets, then clears out older unpinned posts.
// Sending first means a failed send leaves last week's targets up rather than an empty channel,
// and the cleanup can't race the send and delete the new post.
// Crossposting is handled by publishAnnouncement when the message is created.
const postWeeklyTargets = async (strago: Strago): Promise<void> => {
  const channel = await strago.channels.fetch(
    strago.config.weeklyTargetChannelId as string,
  )
  if (channel === null || !channel.isTextBased() || channel.isDMBased()) {
    throw new Error('Weekly targets channel is missing or not a text channel.')
  }
  const embed = generateWeeklyTargetsEmbed(strago.data.weeklyTargets, 0)
  const posted = await channel.send({ embeds: [embed] })
  strago.logger.info('Posted weekly targets.')

  const messages = await channel.messages.fetch()
  await Promise.all(
    messages
      .filter((m) => !m.pinned && m.id !== posted.id)
      .map((m) => m.delete().catch((err) => strago.logger.error(err))),
  )
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
        postWeeklyTargets(strago).catch((err) => strago.logger.error(err))
      },
      null,
      false,
      'Etc/UTC',
    )
    weeklyTargetsCron.start()
  }
}
