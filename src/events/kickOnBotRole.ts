import type { GuildMember } from 'discord.js'

import { BOT_TRAP_ROLE } from '../constants/bot'
import Stats from '../interfaces/models/Stats'
import type { Strago } from '../interfaces/Strago'

/**
 * Kicks members who give themselves the Bot Trap role.
 * @param member the member whose roles changed
 * @param strago Strago client instance
 */
export const kickOnBotRole = async (
  member: GuildMember,
  strago: Strago,
): Promise<void> => {
  if (member.roles.cache.some((r) => r.name === BOT_TRAP_ROLE)) {
    await member.kick('User clicked on bot trap role.')
    await Stats.findOneAndUpdate(
      {},
      { $inc: { botTrapRoleKills: 1 } },
      { upsert: true, setDefaultsOnInsert: true },
    )
    strago.logger.info(
      `Kicked ${member.user.username} for clicking on bot trap role.`,
    )
  }
}
