import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from './Command'
import Shortcut from './models/Shortcut'
import type { Strago } from './Strago'

export const createShortcutCommand = (type: string): Command => ({
  guildCommand: true,
  data: new SlashCommandBuilder()
    .setName(type)
    .setDescription(`Returns specified ${type}.`)
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription(`The title of the ${type}.`)
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async run(interaction: ChatInputCommandInteraction): Promise<void> {
    if (interaction.guild === null) return

    const doc = await Shortcut(type).findOne({
      title: interaction.options.getString('title', true),
    })
    if (doc === null) {
      await interaction.reply({
        content: 'I was unable to locate that.',
        ephemeral: true,
      })
    } else {
      await interaction.deferReply()
      await interaction.editReply({
        ...(doc.content !== undefined && { content: doc.content }),
        files: doc.files.map(
          (f) =>
            new AttachmentBuilder(Buffer.from(f.data, 'base64'), {
              name: f.filename,
            }),
        ),
      })
    }
  },

  autocomplete(strago: Strago, prefix: string): string[] {
    const choices = strago.shortcutTitles.get(type)
    if (choices === undefined) return []
    return Array.from(choices)
      .filter((c) => c.toLowerCase().includes(prefix.toLowerCase()))
      .sort()
  },
})
