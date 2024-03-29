import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'

// eslint-disable-next-line
const XIVAPI = require('@xivapi/js')

const ASPECT_COLORS: Record<string, number> = {
  Fire: 0xffaaaa,
  Water: 0xaaaaff,
  Wind: 0xaaffaa,
  Lightning: 0xffaaff,
  Ice: 0xffffff,
  Earth: 0xffffaa,
}

/**
 * Retrieves information about a given spell.
 */
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

    // Retrieve spell info.
    const xivapi = new XIVAPI()
    const spellInfo = await xivapi.data.get('action', spell.apiId)

    let cast = (Number(spellInfo.Cast100ms) / 10).toFixed(2)
    if (cast === '0.00') {
      cast = 'Instant'
    }
    const recast = (Number(spellInfo.Recast100ms) / 10).toFixed(2)
    const mpCost = (Number(spellInfo.PrimaryCostValue) * 100).toString()
    const range = spell.range !== undefined ? `${spell.range}y` : '-'
    const radius = spell.radius !== undefined ? `${spell.radius}y` : '-'

    const embed = new EmbedBuilder()
      .setTitle(`${spell.number}: ${spell.name} ${spell.rank}`)
      .setColor(ASPECT_COLORS[spell.aspect] ?? 0xaaaaaa)
      .addFields(
        { name: 'Cast', value: cast, inline: true },
        { name: 'Recast', value: recast, inline: true },
        { name: 'Range', value: range, inline: true },
        { name: 'MP Cost', value: mpCost, inline: true },
        {
          name: 'Spell Info',
          value: `${spell.type} / ${spell.aspect}`,
          inline: true,
        },
        { name: 'Radius', value: radius, inline: true },
        { name: 'Description', value: spell.description },
        { name: 'Location', value: spell.location },
      )
      .setThumbnail(spell.icon)
      .setFooter({
        text: 'Information retrieved from XIVAPI and FFXIV Collect.',
      })

    if (spell.notes !== undefined) {
      embed.addFields({ name: 'Notes', value: spell.notes })
    }

    await interaction.reply({ embeds: [embed] })
  },
  autocomplete: (strago: Strago, prefix: string): string[] => {
    const choices = strago.data.spellData.map((s) => s.name)
    const filtered = choices.filter((c) =>
      c.toLowerCase().includes(prefix.toLowerCase()),
    )
    return filtered
  },
  guildCommand: false,
}
