import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import { generateWeeklyTargetsEmbed } from '../modules/weeklyTargets'

/**
 * Returns weekly targets.
 */
export const weeklytargets: Command = {
  data: new SlashCommandBuilder()
    .setName('weeklytargets')
    .setDescription(
      'Returns weekly target info for a given week (default current week).',
    )
    .addNumberOption((option) =>
      option
        .setName('weeks')
        .setDescription(
          'Optional: Number of weeks ahead to look; use negative numbers to look back.',
        ),
    ),
  run: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const weeks = interaction.options.getNumber('weeks') ?? 0
    const embed = generateWeeklyTargetsEmbed(weeks)
    await interaction.reply({ embeds: [embed] })
  },
  guildCommand: false,
}
