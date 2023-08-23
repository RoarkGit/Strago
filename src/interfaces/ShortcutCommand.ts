import type { Strago } from './Strago'

import { type CommandInteraction, SlashCommandBuilder, SlashCommandStringOption, type SlashCommandSubcommandsOnlyBuilder } from 'discord.js'
import type { Command } from './Command'

/**
 * Command for use with shortcuts command, instantiated by 'type.'
 */
export class ShortcutCommand implements Command {
  guildCommand: boolean
  type: string
  titleOption: SlashCommandStringOption
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder

  constructor (type: string) {
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

  public async run (interaction: CommandInteraction, strago: Strago): Promise<void> {
    if (!interaction.isChatInputCommand() || interaction.guild === null) return

    const collection = strago.db.collection(this.type)
    const doc = await collection.findOne({ title: interaction.options.getString('title', true) })
    if (doc === null) {
      await interaction.reply({ content: 'I was unable to locate that.', ephemeral: true })
    } else {
      await interaction.deferReply()
      const response = {
        ...(doc.content !== undefined && { content: doc.content }),
        files: doc.files
      }
      await interaction.editReply(response)
    }
  }

  public autocomplete (strago: Strago, prefix: string): string[] {
    const choices = strago.shortcutTitles.get(this.type)
    if (choices === undefined) return []
    const filtered = Array.from(choices).filter(c => c.toLowerCase().includes(prefix.toLowerCase())).sort()
    return filtered
  }
};
