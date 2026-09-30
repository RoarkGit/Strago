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

export const spelllore: Command = {
  data: new SlashCommandBuilder()
    .setName('spelllore')
    .setDescription(
      "Retrieves a spell's lore entry from the Blue Magic Spellbook.",
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription("The spell's name.")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    const name = interaction.options.getString('name', true).toLowerCase()

    const spell = strago.data.spellData.get(name)
    if (spell == null) {
      await interaction.reply({
        content: 'I could not locate that spell.',
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    const attachment = new AttachmentBuilder(
      `${PATHS.spellImages()}/${spell.id}.png`,
      { name: `${spell.id}.png` },
    )

    const embed = new EmbedBuilder()
      .setTitle(`${spell.number}: ${spell.name}`)
      .setColor(0xaaaaaa)
      .setDescription(spell.lore)
      .setThumbnail(`attachment://${spell.id}.png`)
      .addFields({
        name: '​',
        value: DATA_SOURCE_CREDIT,
      })

    await interaction.reply({ embeds: [embed], files: [attachment] })
  },
  autocomplete: (strago: Strago, prefix: string): string[] =>
    matchingChoices(
      strago.data.spellData.map((s) => s.name),
      prefix,
    ),
  guildCommand: false,
}
