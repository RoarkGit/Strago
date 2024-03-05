import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import Shortcut from '../interfaces/models/Shortcut'
import type { Strago } from '../interfaces/Strago'

/**
 * Meta-command for managing shortcut commands.
 */
export class Shortcuts implements Command {
  data:
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
  guildCommand: boolean

  constructor() {
    this.guildCommand = true
    this.data = new SlashCommandBuilder()
      .setName('shortcuts')
      .setDescription('Various commands for managing shortcuts.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  }

  public async run(
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> {
    if (interaction.guild === null || interaction.channel === null) return
    try {
      await interaction.deferReply()
      const command = interaction.options.getSubcommand()
      const type = interaction.options.getSubcommandGroup(true)
      const title = interaction.options.getString('title', true)
      if (command === 'set') {
        const messageId = interaction.options.getString('message_id', true)
        const message = await interaction.channel.messages.fetch(messageId)
        console.log(message)
        const content = message.content
        const files = await Promise.all(
          message.attachments.map(async (a) => {
            const response = await fetch(a.url)
            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            return Buffer.from(arrayBuffer).toString('base64')
          }),
        )
        const document = {
          title,
          content,
          files,
        }
        await Shortcut(type).findOneAndReplace({ title }, document, {
          upsert: true,
        })
        strago.shortcutTitles.get(type)?.add(title)
        await interaction.editReply({
          content: `New ${type} ${title} successfully saved!`,
        })
      } else if (command === 'delete') {
        const result = await Shortcut(type).deleteOne({ title })
        if (result.deletedCount === 1) {
          await interaction.editReply({
            content: `${type} ${title} successfully deleted!`,
          })
          strago.shortcutTitles.get(type)?.delete(title)
        } else {
          await interaction.editReply({
            content: "I couldn't find a shortcut with that title.",
          })
        }
      } else {
        await interaction.editReply({
          content: 'Unexpected subcommand specified.',
        })
      }
    } catch (err) {
      strago.logger.error(err)
      await interaction.editReply({
        content: 'Something went wrong while processing your request.',
      })
    }
  }

  /**
   * Generates subcommands for each 'type' of shortcut.
   */
  public generateSubcommands(strago: Strago): void {
    const data = this.data as SlashCommandBuilder
    for (const t of strago.config.shortcutTypes) {
      const subcommandGroup = new SlashCommandSubcommandGroupBuilder()
        .setName(t)
        .setDescription(`Add, update, or delete ${t} shortcuts.`)
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription(
              `Adds a new ${t} or updates an existing ${t} shortcut.`,
            )
            .addStringOption((option) =>
              option
                .setName('title')
                .setDescription(`The title of the ${t}.`)
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addStringOption((option) =>
              option
                .setName('message_id')
                .setDescription('ID of message to be stored.')
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('delete')
            .setDescription(`Deletes a ${t} shortcut.`)
            .addStringOption((option) =>
              option
                .setName('title')
                .setDescription(`The title of the ${t}.`)
                .setRequired(true)
                .setAutocomplete(true),
            ),
        )
      data.addSubcommandGroup(subcommandGroup)
    }
  }

  public autocomplete(
    strago: Strago,
    prefix: string,
    interaction: AutocompleteInteraction,
  ): string[] {
    const type = interaction.options.getSubcommandGroup(true)
    const choices = strago.shortcutTitles.get(type)
    if (choices === undefined) return []
    const filtered = Array.from(choices)
      .filter((c) => c.toLowerCase().includes(prefix.toLowerCase()))
      .sort()
    return filtered
  }
}

export const shortcuts = new Shortcuts()
