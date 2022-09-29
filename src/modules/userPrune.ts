import { Strago } from '../interfaces/Strago'

/**
 * Prunes all users who have not verified and joined more than ten minutes ago.
 */
export const userPrune = async (strago: Strago): Promise<void> => {
  const guilds = strago.guilds.cache
  const now = Date.now()
  await Promise.all(guilds.map(async (g) => {
    const tenMinutesMs = 1000 * 60 * 10
    const members = await g.members.fetch()
    const toPrune = members.filter(m => m.roles.cache.every(r => r.name !== 'Verified') && m.joinedTimestamp !== null && (now - m.joinedTimestamp > tenMinutesMs))
    await Promise.all(toPrune.map(async m => {
      strago.logger.info(`Removing unverified user: ${m.user.username}`)
      await m.kick('Verification time exceeded ten minutes.').catch(error => strago.logger.error(error))
    }))
  }))
}
