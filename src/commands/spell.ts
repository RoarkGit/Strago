import { join } from 'path'

import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'

const IMAGES_PATH = join(__dirname, '../../src/data/Blue-Mage-Data/images')

const ASPECT_COLORS: Record<string, number> = {
  Fire: 0xffaaaa,
  Water: 0xaaaaff,
  Wind: 0xaaffaa,
  Lightning: 0xffaaff,
  Ice: 0xffffff,
  Earth: 0xffffaa,
}

function cleanField(text: string): string {
  return text
    .replace(/\{\{< \w+ "(.*?)" >\}\}/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

export const spell: Command = {
  data: new SlashCommandBuilder()
    .setName('spell')
    .setDescription('Retrieves information about a given spell.')
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
        ephemeral: true,
      })
      return
    }

    const cast = spell.cast === 0 ? 'Instant' : `${spell.cast.toFixed(2)}s`
    const recast = `${spell.recast.toFixed(2)}s`
    const mp = spell.mp != null && spell.mp > 0 ? spell.mp.toString() : '0'
    const range = spell.range != null ? `${spell.range}y` : '-'
    const radius = spell.radius != null ? `${spell.radius}y` : '-'
    const rank = '★'.repeat(spell.rank)

    const attachment = new AttachmentBuilder(
      join(IMAGES_PATH, `${spell.id}.png`),
      { name: `${spell.id}.png` },
    )

    const embed = new EmbedBuilder()
      .setTitle(`${spell.number}: ${spell.name} ${rank}`)
      .setColor(ASPECT_COLORS[spell.spellAspect] ?? 0xaaaaaa)
      .addFields(
        { name: 'Cast', value: cast, inline: true },
        { name: 'Recast', value: recast, inline: true },
        { name: 'Range', value: range, inline: true },
        { name: 'MP Cost', value: mp, inline: true },
        {
          name: 'Spell Info',
          value: `${spell.spellType} / ${spell.spellAspect}`,
          inline: true,
        },
        { name: 'Radius', value: radius, inline: true },
        { name: 'Description', value: cleanField(spell.description) },
        { name: 'Location', value: cleanField(spell.location) },
      )
      .setThumbnail(`attachment://${spell.id}.png`)

    if (spell.notes != null) {
      embed.addFields({ name: 'Notes', value: cleanField(spell.notes) })
    }

    embed.addFields({
      name: '​',
      value: 'Information sourced from [Blue Academy](https://github.com/RoarkGit/Blue-Mage-Data)',
    })

    await interaction.reply({ embeds: [embed], files: [attachment] })
  },
  autocomplete: (strago: Strago, prefix: string): string[] =>
    strago.data.spellData
      .map((s) => s.name)
      .filter((c) => c.toLowerCase().includes(prefix.toLowerCase())),
  guildCommand: false,
}
