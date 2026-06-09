import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import type { Command } from '../interfaces/Command'
import Stats from '../interfaces/models/Stats'
import type { Strago } from '../interfaces/Strago'

export const botkills: Command = {
  data: new SlashCommandBuilder()
    .setName('botkills')
    .setDescription('Shows bot trap kill counts.'),
  run: async (
    interaction: ChatInputCommandInteraction,
    _strago: Strago,
  ): Promise<void> => {
    const stats = await Stats.findOne()
    const honeypot = stats?.honeypotKills ?? 0
    const roleTrap = stats?.botTrapRoleKills ?? 0
    await interaction.reply(
      `**Bot Trap Stats**\nHoneypot kills: ${honeypot}\nRole trap kills: ${roleTrap}\nTotal: ${honeypot + roleTrap}`,
    )
  },
  guildCommand: true,
}
