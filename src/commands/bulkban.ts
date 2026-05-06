import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'
import { confirmAction } from '../utils/confirmAction'

export const bulkban: Command = {
  data: new SlashCommandBuilder()
    .setName('bulkban')
    .setDescription('Bans all users whose name starts with a given prefix.')
    .addStringOption((option) =>
      option
        .setName('prefix')
        .setDescription('The prefix to ban.')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    if (interaction.guild === null) return

    const members = await interaction.guild.members.fetch()
    const prefix = interaction.options.getString('prefix', true)
    const filtered = members.filter((m) => m.user.username.startsWith(prefix))

    const usernames = new Set<string>()
    filtered.forEach((m) => usernames.add(m.user.username.split('#')[0]))

    let content = 'I found these users:\n' + Array.from(usernames).join('\n')
    if (content.length > 2000) {
      content = 'There were too many usernames to list. Ban anyway?'
    }

    await confirmAction(interaction, strago, content, 'Ban', async () => {
      await Promise.all(
        filtered.map(async (m) =>
          m.ban().catch((err) => strago.logger.error(err)),
        ),
      )
      await interaction.editReply({ components: [] })
    })
  },
  guildCommand: true,
}
