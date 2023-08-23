import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type CommandInteraction,
  ComponentType,
  type MessageActionRowComponentBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'

/**
 * Removes a specified role from all users in the server.
 */
export const recreaterole: Command = {
  data: new SlashCommandBuilder()
    .setName('recreaterole')
    .setDescription(
      'Recreates a specified role, effectively removing it from all users in the server.',
    )
    .addStringOption((option) =>
      option
        .setName('id')
        .setDescription('The role (id) to remove.')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  run: async (
    interaction: CommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    if (!interaction.isChatInputCommand() || interaction.guild === null) return

    // Fetch members so responses will be correct.
    const guild = interaction.guild
    await guild.members.fetch()
    const roleId = interaction.options.getString('id', true)
    const role = interaction.guild.roles.cache.find((r) => r.id === roleId)

    if (role === undefined) {
      await interaction.reply("I couldn't find that role.")
      return
    }

    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(interaction.user.id)
          .setLabel('Remove')
          .setStyle(ButtonStyle.Primary),
      )

    if (interaction.channel === null) return

    const members = role.members
    const response = `I found the role ${role.toString()} with ${
      members.size
    } members.`

    const message = await interaction.reply({
      content: response,
      components: [row],
    })

    message
      .awaitMessageComponent({
        filter: (i) => i.customId === i.user.id,
        componentType: ComponentType.Button,
      })
      .then(async () => {
        await interaction.editReply({
          content: 'Cloning role...',
          components: [],
        })
        const newRole = await guild.roles.create({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          permissions: role.permissions,
          position: role.position,
          mentionable: role.mentionable,
          icon: role.iconURL(),
          unicodeEmoji: role.unicodeEmoji,
        })
        await interaction.editReply({
          content: 'Deleting old role...',
          components: [],
        })
        await role.delete()
        await interaction.editReply({
          content: `I deleted the old role and created ${newRole.toString()} in its place.`,
          components: [],
        })
      })
      .catch((err) => strago.logger.error(err))
  },
  guildCommand: true,
}
