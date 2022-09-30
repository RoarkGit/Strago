import { Strago } from '../interfaces/Strago'

/**
 * Prunes all users who have not verified and joined more than ten minutes ago.
 */
export const userPrune = async (strago: Strago): Promise<void> => {
  // Only prune from home guild.
  const guild = strago.guilds.cache.get(strago.config.homeGuildId)
  if (guild === undefined) return
  const now = Date.now()
  const tenMinutesMs = 1000 * 60 * 10
  const members = await guild.members.fetch()
  const toPrune = members.filter(m => m.roles.cache.every(r => r.name !== 'Verified') && m.joinedTimestamp !== null && (now - m.joinedTimestamp > tenMinutesMs))
  await Promise.all(toPrune.map(async m => {
    strago.logger.info(`Removing unverified user: ${m.user.username}`)
    await m.kick('Verification time exceeded ten minutes.').catch(error => strago.logger.error(error))
  }))
}
