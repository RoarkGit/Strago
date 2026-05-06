import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'
import { confirmAction } from '../utils/confirmAction'

export const purgerole: Command = {
  data: new SlashCommandBuilder()
    .setName('purgerole')
    .setDescription('Removes all members from a specified role.')
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('The role (id) to purge.')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    if (interaction.guild === null) return

    const guild = interaction.guild
    await guild.members.fetch()
    const roleId = interaction.options.getString('id', true)
    const role = guild.roles.cache.find((r) => r.id === roleId)

    if (role === undefined) {
      await interaction.reply("I couldn't find that role.")
      return
    }

    const memberCount = role.members.size
    const content = `I found the role ${role.toString()} with ${memberCount} members.`

    await confirmAction(interaction, strago, content, 'Remove', async () => {
      await interaction.editReply({
        content: 'Removing role from members...',
        components: [],
      })
      await Promise.all(role.members.map((member) => member.roles.remove(role)))
      await interaction.editReply({
        content: `Removed ${role.toString()} from ${memberCount} members.`,
        components: [],
      })
    })
  },
  guildCommand: true,
}
