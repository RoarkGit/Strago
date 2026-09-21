import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'
import { PATHS } from '../utils/paths'

export const beastlore: Command = {
  data: new SlashCommandBuilder()
    .setName('beastlore')
    .setDescription(
      "Retrieves a beast's lore entry from the Master's Bestiary.",
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription("The beast's name.")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    const name = interaction.options.getString('name', true).toLowerCase()

    const beast = strago.data.beastData.get(name)
    if (beast == null) {
      await interaction.reply({
        content: 'I could not locate that beast.',
        ephemeral: true,
      })
      return
    }

    const attachment = new AttachmentBuilder(
      `${PATHS.beastImages()}/${beast.id}.png`,
      { name: `${beast.id}.png` },
    )

    const embed = new EmbedBuilder()
      .setTitle(`${beast.number}: ${beast.name}`)
      .setColor(0xaaaaaa)
      .setDescription(beast.lore)
      .setThumbnail(`attachment://${beast.id}.png`)
      .addFields({
        name: '​',
        value:
          'Information sourced from [Blue Academy](https://github.com/RoarkGit/Limited-Job-Data)',
      })

    await interaction.reply({ embeds: [embed], files: [attachment] })
  },
  autocomplete: (strago: Strago, prefix: string): string[] =>
    strago.data.beastData
      .map((b) => b.name)
      .filter((n) => n.toLowerCase().includes(prefix.toLowerCase())),
  guildCommand: false,
}
