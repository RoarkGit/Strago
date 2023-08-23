import { CronJob } from 'cron'

import { type Strago } from '../interfaces/Strago'

import { channelPrune } from '../modules/channelPrune'
import { generateWeeklyTargetsEmbed } from '../modules/weeklyTargets'
import { type TextChannel } from 'discord.js'

/**
 * Prints message when bot is connected and ready.
 * @param strago Strago client instance
 */
export const ready = async (strago: Strago): Promise<void> => {
  strago.logger.info('Discord ready!')
  const guildList = strago.guilds.cache
  await Promise.all(guildList.map(async g => await g.members.fetch()))
  const guildNames = guildList.map(g => ({ guildName: g.name, guildId: g.id }))
  strago.logger.info({ message: `Connected to ${guildList.size} servers.`, guilds: guildNames })
  // Start channel prune cron.
  const channelPruneCron = new CronJob({
    cronTime: '0 */10 * * * *',
    onTick: () => {
      channelPrune(strago).catch(err => strago.logger.error(err))
    },
    timeZone: 'Etc/UTC'
  })
  channelPruneCron.start()
  // Start weekly targets cron.
  const weeklyTargetsCron = new CronJob({
    cronTime: '0 0 8 * * 2',
    onTick: () => {
      const embed = generateWeeklyTargetsEmbed(0)
      const channel = strago.channels.cache.get(strago.config.weeklyTargetChannelId) as TextChannel
      channel.send({ embeds: [embed] }).catch(err => strago.logger.error(err))
    },
    timeZone: 'Etc/UTC'
  })
  weeklyTargetsCron.start()
}
