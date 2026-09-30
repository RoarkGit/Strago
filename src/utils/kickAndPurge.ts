import type { GuildMember } from 'discord.js'

import { ONE_HOUR_MS } from '../constants/time'

/**
 * Kicks a member and deletes their last hour of messages, by banning and immediately unbanning them.
 * @param member the member to remove
 * @param reason the reason shown in the audit log
 */
export const kickAndPurge = async (
  member: GuildMember,
  reason: string,
): Promise<void> => {
  await member.ban({ deleteMessageSeconds: ONE_HOUR_MS / 1000, reason })
  await member.guild.members.unban(member.id, reason)
}
