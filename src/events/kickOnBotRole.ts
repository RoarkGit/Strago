import { type Strago } from '../interfaces/Strago'

import { type GuildMember } from 'discord.js'

/**
 * Handles slash command interaction.
 * @param interaction the interaction that triggered the event
 * @param strago Strago client instance
 */
export const kickOnBotRole = async (member: GuildMember, strago: Strago): Promise<void> => {
  if (member.roles.cache.some(r => r.name === 'Bot Trap')) {
    await member.kick('User clicked on bot trap role.')
    strago.logger.info(`Kicked ${member.user.username} for clicking on bot trap role.`)
  }
}
