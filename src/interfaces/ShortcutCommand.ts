import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandStringOption,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'

import type { Command } from './Command'
import Shortcut from './models/Shortcut'
import type { Strago } from './Strago'

/**
 * Command for use with shortcuts command, instantiated by 'type.'
 */
export class ShortcutCommand implements Command {
  guildCommand: boolean
  type: string
  titleOption: SlashCommandStringOption
  data:
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    | SlashCommandSubcommandsOnlyBuilder

  constructor(type: string) {
    this.guildCommand = true
    this.titleOption = new SlashCommandStringOption()
      .setName('title')
      .setDescription(`The title of the ${type}.`)
      .setRequired(true)
      .setAutocomplete(true)
    this.data = new SlashCommandBuilder()
      .setName(type)
      .setDescription(`Returns specified ${type}.`)
      .addStringOption(this.titleOption)
    this.type = type
  }

  public async run(interaction: ChatInputCommandInteraction): Promise<void> {
    if (interaction.guild === null) return

    const doc = await Shortcut(this.type).findOne({
      title: interaction.options.getString('title', true),
    })
    if (doc === null) {
      await interaction.reply({
        content: 'I was unable to locate that.',
        ephemeral: true,
      })
    } else {
      await interaction.deferReply()
      const attachments = doc.files.map((f) => {
        return new AttachmentBuilder(Buffer.from(f, 'base64'), {
          name: 'test.mp4',
        })
      })
      await interaction.editReply({
        files: attachments,
      })
    }
  }

  public autocomplete(strago: Strago, prefix: string): string[] {
    const choices = strago.shortcutTitles.get(this.type)
    if (choices === undefined) return []
    const filtered = Array.from(choices)
      .filter((c) => c.toLowerCase().includes(prefix.toLowerCase()))
      .sort()
    return filtered
  }
}
