import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'
import type { ObjectId } from 'mongodb'

import type { Command } from '../interfaces/Command'
import Shortcut from '../interfaces/models/Shortcut'
import type { Strago } from '../interfaces/Strago'
import { gridfs } from '../utils/connectDatabase'

async function uploadToGridFS(filename: string, buffer: Buffer): Promise<ObjectId> {
  return new Promise((resolve, reject) => {
    const stream = gridfs.openUploadStream(filename)
    stream.end(buffer)
    stream.on('finish', () => resolve(stream.id as ObjectId))
    stream.on('error', reject)
  })
}

export const shortcuts: Command = {
  guildCommand: true,
  data: new SlashCommandBuilder()
    .setName('shortcuts')
    .setDescription('Various commands for managing shortcuts.')
    .setDefaultMemberPermissions(PermissionFlagsBits.PinMessages),

  async run(
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
        const files = await Promise.all(
          message.attachments.map(async (a) => {
            const response = await fetch(a.url)
            const buffer = Buffer.from(await response.arrayBuffer())
            const fileId = await uploadToGridFS(a.name, buffer)
            return { filename: a.name, fileId }
          }),
        )
        const existing = await Shortcut(type).findOne({ title })
        await Shortcut(type).findOneAndReplace(
          { title },
          { title, content: message.content, files },
          { upsert: true },
        )
        if (existing !== null) {
          await Promise.all(existing.files.map((f) => gridfs.delete(f.fileId)))
        }
        strago.shortcutTitles.get(type)?.add(title)
        await interaction.editReply({
          content: `New ${type} ${title} successfully saved!`,
        })
      } else if (command === 'delete') {
        const existing = await Shortcut(type).findOneAndDelete({ title }, null)
        if (existing !== null) {
          await Promise.all(existing.files.map((f) => gridfs.delete(f.fileId)))
          strago.shortcutTitles.get(type)?.delete(title)
          await interaction.editReply({
            content: `${type} ${title} successfully deleted!`,
          })
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
  },

  autocomplete(
    strago: Strago,
    prefix: string,
    interaction: AutocompleteInteraction,
  ): string[] {
    const type = interaction.options.getSubcommandGroup(true)
    const choices = strago.shortcutTitles.get(type)
    if (choices === undefined) return []
    return Array.from(choices)
      .filter((c) => c.toLowerCase().includes(prefix.toLowerCase()))
      .sort()
  },
}

export const generateSubcommands = (strago: Strago): void => {
  const data = shortcuts.data as SlashCommandBuilder &
    SlashCommandSubcommandsOnlyBuilder
  for (const t of strago.config.shortcutTypes) {
    data.addSubcommandGroup(
      new SlashCommandSubcommandGroupBuilder()
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
        ),
    )
  }
}
