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
 * Retrieves list of all users whose name starts with a provided string and provides an option to ban them.
 */
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
    interaction: CommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    if (!interaction.isChatInputCommand() || interaction.guild === null) return

    const members = await interaction.guild.members.fetch()
    const prefix = interaction.options.getString('prefix', true)
    const filtered = members.filter((m) => m.user.username.startsWith(prefix))

    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(interaction.user.id)
          .setLabel('Ban')
          .setStyle(ButtonStyle.Primary),
      )

    if (interaction.channel === null) return

    // Only list unique usernames, check if message length exceeds 2000.
    const usernames = new Set()
    filtered.forEach((m) => usernames.add(m.user.username.split('#')[0]))

    let usernameString =
      'I found these users:\n' + Array.from(usernames).join('\n')
    if (usernameString.length > 2000) {
      usernameString = 'There were too many usernames to list. Ban anyway?'
    }

    const message = await interaction.reply({
      content: usernameString,
      components: [row],
    })

    message
      .awaitMessageComponent({
        filter: (i) => i.customId === i.user.id,
        componentType: ComponentType.Button,
      })
      .then(async () => {
        await Promise.all(
          filtered.map(
            async (m) => await m.ban().catch((err) => strago.logger.error(err)),
          ),
        )
        await interaction.editReply({ components: [] })
      })
      .catch((err) => strago.logger.error(err))
  },
  guildCommand: true,
}
