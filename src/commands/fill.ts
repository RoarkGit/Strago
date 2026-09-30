import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js'
import { type Document } from 'mongoose'

import { FILL_ROLE, RATE_LIMITED_MESSAGE } from '../constants/bot'
import { type Command } from '../interfaces/Command'
import Fill, { type IFill } from '../interfaces/models/Fill'
import { type Strago } from '../interfaces/Strago'
import { findFill } from '../modules/fillFind'
import { configureFillRoles } from '../modules/fillRoles'

export const fill: Command = {
  data: new SlashCommandBuilder()
    .setName('fill')
    .setDescription('Enable/disable fill notifications.')
    .addSubcommand((subcommand) =>
      subcommand.setName('on').setDescription('Turns fill notifications on.'),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('off').setDescription('Turns fill notifications off.'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('roles')
        .setDescription('Configure fill roles for which you are eligible.'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('find')
        .setDescription('Find a fill by role/content type.'),
    ),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    if (interaction.guild === null || interaction.member === null) return
    const command = interaction.options.getSubcommand()

    if (command === 'find') {
      if (
        interaction.channel === null ||
        interaction.channel.isDMBased() ||
        interaction.channel.parent === null ||
        interaction.channel.parent.id !== strago.config.lfgCategoryId
      ) {
        await interaction.reply({
          content:
            "This command can only be run in 'lfg' or 'recruitment' channels",
          flags: MessageFlags.Ephemeral,
        })
        return
      }
      if (strago.fillSpamSet.has(interaction.user.id)) {
        await interaction.reply({
          content: RATE_LIMITED_MESSAGE,
          flags: MessageFlags.Ephemeral,
        })
        return
      }
      const lfgMessage = (
        await interaction.channel.messages.fetch({ around: interaction.id })
      ).find((m) => m.author === interaction.user)
      if (lfgMessage === undefined || lfgMessage.content === '') {
        await interaction.reply({
          content:
            "I couldn't find a recent message from you in this channel, please post a message before looking for a fill.",
          flags: MessageFlags.Ephemeral,
        })
        return
      }
      await findFill(interaction, strago, lfgMessage)
      return
    }

    const fill: Document<IFill> = await Fill.findOneAndUpdate(
      { discordId: interaction.user.id },
      { $setOnInsert: { discordId: interaction.user.id } },
      { returnDocument: 'after', setDefaultsOnInsert: true, upsert: true },
    )

    if (command === 'on' || command === 'off') {
      const enabled = command === 'on'
      fill.set('enabled', enabled)
      await fill.save()
      await interaction.reply({
        content: `Turned fill notifications ${command}.`,
        flags: MessageFlags.Ephemeral,
      })
      const member = await interaction.guild.members.fetch(interaction.user.id)
      const fillRole = interaction.guild.roles.cache.find(
        (r) => r.name === FILL_ROLE,
      )
      if (fillRole === undefined) {
        strago.logger.error(`Undefined role: ${FILL_ROLE}`)
        return
      }
      if (enabled) await member.roles.add(fillRole)
      else await member.roles.remove(fillRole)
    } else if (command === 'roles') {
      await configureFillRoles(interaction, fill)
    }
  },
  guildCommand: true,
}
