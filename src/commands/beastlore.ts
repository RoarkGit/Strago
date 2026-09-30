import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'

import { DATA_SOURCE_CREDIT } from '../constants/bot'
import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'
import { PATHS } from '../utils/paths'
import { matchingChoices } from '../utils/text'

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
        flags: MessageFlags.Ephemeral,
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
        value: DATA_SOURCE_CREDIT,
      })

    await interaction.reply({ embeds: [embed], files: [attachment] })
  },
  autocomplete: (strago: Strago, prefix: string): string[] =>
    matchingChoices(
      strago.data.beastData.map((b) => b.name),
      prefix,
    ),
  guildCommand: false,
}
