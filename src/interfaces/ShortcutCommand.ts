import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'
import type { ObjectId } from 'mongodb'

import type { Command } from './Command'
import Shortcut from './models/Shortcut'
import type { Strago } from './Strago'
import { gridfs } from '../utils/connectDatabase'
import { matchingChoices } from '../utils/text'

async function downloadFromGridFS(fileId: ObjectId): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const stream = gridfs.openDownloadStream(fileId)
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

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
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.deferReply()
      const buffers = await Promise.all(
        doc.files.map((f) => downloadFromGridFS(f.fileId)),
      )
      await interaction.editReply({
        ...(doc.content !== undefined && { content: doc.content }),
        files: buffers.map(
          (buf, i) =>
            new AttachmentBuilder(buf, { name: doc.files[i].filename }),
        ),
      })
    }
  },

  autocomplete(strago: Strago, prefix: string): string[] {
    const choices = strago.shortcutTitles.get(type)
    if (choices === undefined) return []
    return matchingChoices(choices, prefix)
  },
})
