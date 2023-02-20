import { Strago } from '../interfaces/Strago'
import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

import { Command } from '../interfaces/Command'

// eslint-disable-next-line
const XIVAPI = require('@xivapi/js')

const ASPECT_COLORS: { [key: string]: number } = {
  Fire: 0xFFAAAA,
  Water: 0xAAAAFF,
  Wind: 0xAAFFAA,
  Lightning: 0xFFAAFF,
  Ice: 0xFFFFFF,
  Earth: 0xFFFFAA
}

const EMPTY_COLUMN = { name: '\u200b', value: '\u200b', inline: true }

/**
 * Retrieves information about a given spell.
 */
export const spell: Command = {
  data: new SlashCommandBuilder()
    .setName('spell')
    .setDescription('Retrieves information about a given spell.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription("The spell's name.")
        .setRequired(true)
        .setAutocomplete(true))
    .addBooleanOption(option =>
      option.setName('send_to_chat')
        .setDescription('If true, response will be sent to chat (visible to all).')),
  run: async (interaction: CommandInteraction, strago: Strago): Promise<void> => {
    if (!interaction.isChatInputCommand()) return

    const name = interaction.options.getString('name', true).toLowerCase()
    const print = interaction.options.getBoolean('send_to_chat') ?? false

    const spell = strago.data.spellData.get(name)
    if (spell == null) {
      await interaction.reply({ content: 'I could not locate that spell.', ephemeral: true })
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

    const embed = new EmbedBuilder()
      .setTitle(`${spell.number}: ${spell.name} ${spell.rank}`)
      .setColor(ASPECT_COLORS[spell.aspect] ?? 0xAAAAAA)
      .addFields(
        { name: 'Cast', value: cast, inline: true },
        { name: 'Recast', value: recast, inline: true },
        EMPTY_COLUMN,
        { name: 'MP Cost', value: mpCost, inline: true },
        { name: 'Spell Info', value: `${spell.type} / ${spell.aspect}`, inline: true },
        EMPTY_COLUMN,
        { name: 'Description', value: spell.description },
        { name: 'Location', value: spell.location }
      )
      .setThumbnail(spell.icon)
      .setFooter({ text: 'Information retrieved from XIVAPI and FFXIV Collect.' })

    if (spell.notes !== undefined) {
      embed.addFields({ name: 'Notes', value: spell.notes })
    }

    await interaction.reply({ embeds: [embed], ephemeral: !print })
  },
  autocomplete: (strago: Strago, prefix: string): string[] => {
    const choices = strago.data.spellData.map(s => s.name)
    const filtered = choices.filter(c => c.toLowerCase().includes(prefix.toLowerCase()))
    return filtered
  },
  guildCommand: false
}
