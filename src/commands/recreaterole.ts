import { Strago } from '../interfaces/Strago'

import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { Command } from '../interfaces/Command'

/**
 * Removes a specified role from all users in the server.
 */
export const recreaterole: Command = {
  data: new SlashCommandBuilder()
    .setName('recreaterole')
    .setDescription('Recreates a specified role, effectively removing it from all users in the server.')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('The role (id) to remove.')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  run: async (interaction: CommandInteraction, strago: Strago): Promise<void> => {
    if (!interaction.isChatInputCommand() || interaction.guild === null) return

    // Fetch members so responses will be correct.
    const guild = interaction.guild
    await guild.members.fetch()
    const roleId = interaction.options.getString('id', true)
    const role = interaction.guild.roles.cache.find(r => r.id === roleId)

    if (!role) {
      await interaction.reply("I couldn't find that role.")
      return
    }

    const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.user.id)
        .setLabel('Remove')
        .setStyle(ButtonStyle.Primary))

    if (interaction.channel === null) return

    const members = role.members
    const response = `I found the role ${role} with ${members.size} members.`

    const message = await interaction.reply({
      content: response,
      components: [row]
    } as any
    )

    const filter = (i: ButtonInteraction): boolean => {
      return i.customId === i.user.id
    }
    message.awaitMessageComponent({ filter } as any)
      .then(async () => {
        await interaction.editReply({ content: `Cloning role...`, components: [] })
        const newRole = await guild.roles.create({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            permissions: role.permissions,
            position: role.position,
            mentionable: role.mentionable,
            icon: role.iconURL(),
            unicodeEmoji: role.unicodeEmoji
        })
        await interaction.editReply({ content: `Deleting old role...`, components: [] })
        await role.delete()
        await interaction.editReply({ content: `I deleted the old role and created ${newRole} in its place.`, components: [] })
      })
      .catch(err => strago.logger.error(err))
  },
  guildCommand: true
}
