import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  Collection,
  ComponentType,
  EmbedBuilder,
  GuildEmoji,
  GuildMemberRoleManager,
  Message,
  Role,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { Document } from 'mongoose'

import fillData from '../data/fillData.json'
import { Command } from '../interfaces/Command'
import Fill, { IFill } from '../interfaces/models/Fill'
import { Strago } from '../interfaces/Strago'

const idLabels: Collection<string, string> = new Collection<string, string>()

// Create base button for use in action rows.
function createButton(
  id: string,
  data: { label: string; emoji?: string; guildEmoji?: string },
  emojis: Collection<string, GuildEmoji>,
  enabled: boolean,
): ButtonBuilder {
  const emoji = emojis.find((e) => e.name === data.guildEmoji)
  const button = new ButtonBuilder().setCustomId(id).setLabel(data.label)
  if (emoji !== undefined) {
    button.setEmoji(emoji.identifier)
  } else if (data.emoji !== undefined) {
    button.setEmoji(data.emoji)
  }
  // Set style for enabled/disabled.
  button.setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
  return button
}

// Create option for use in string select menus.
function createOption(
  id: string,
  data: { label: string; emoji?: string; guildEmoji?: string },
  emojis: Collection<string, GuildEmoji>,
): StringSelectMenuOptionBuilder {
  idLabels.set(id, data.label)
  const emoji = emojis.find((e) => e.name === data.guildEmoji)
  const option = new StringSelectMenuOptionBuilder()
    .setLabel(data.label)
    .setValue(id)
  if (emoji !== undefined) {
    option.setEmoji(emoji.identifier)
  } else if (data.emoji !== undefined) {
    option.setEmoji(data.emoji)
  }
  return option
}

// Handle role configuration command
async function roles(
  interaction: ChatInputCommandInteraction,
  fill: Document<IFill>,
): Promise<void> {
  if (interaction.guild === null || interaction.member === null) return
  const buttons: Collection<string, ButtonBuilder> = new Collection<
    string,
    ButtonBuilder
  >()

  // Fetch roles for user.
  const roles = interaction.member.roles as GuildMemberRoleManager
  const emojis = interaction.guild.emojis.cache
  const legend = roles.cache.some((r) => r.name === 'Blue Legend')

  const rows: ActionRowBuilder<ButtonBuilder>[] = []

  // Create content buttons.
  Object.values(fillData.content).forEach((contentData) => {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        Object.entries(contentData).map(([id, data]) => {
          const button = createButton(id, data, emojis, fill.get(id))
          // Disable button if missing eligible role.
          button.setDisabled(
            data.requiresRole !== undefined &&
              !legend &&
              !roles.cache.some((r) => r.name === data.requiresRole),
          )
          buttons.set(id, button)
          return button
        }),
      ),
    )
  })

  // Create role buttons.
  const roleRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    Object.entries(fillData.roles).map(([id, data]) => {
      const button = createButton(id, data, emojis, fill.get(id))
      buttons.set(id, button)
      return button
    }),
  )

  // Create done button.
  const doneRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('save')
      .setLabel('Save')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Primary),
  )

  rows.push(roleRow, doneRow)
  const response = await interaction.reply({
    content:
      'Click the buttons for content that you would like to fill for. You _must_ have the achievement-based roles from Strago to click the associated buttons.',
    components: rows,
    ephemeral: true,
  })

  // Handle button presses.
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  })
  collector.on('collect', async (i: ButtonInteraction) => {
    if (i.customId === 'save') {
      await i.update({
        content: 'Updated your fill configuration.',
        components: [],
      })
      await fill.save()
      collector.stop()
    } else {
      const set = !fill.get(i.customId)
      fill.set(i.customId, set)
      buttons
        .get(i.customId)
        ?.setStyle(set ? ButtonStyle.Success : ButtonStyle.Secondary)
      await i.update({ components: rows })
    }
  })

  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      await response.edit({
        content: 'Interaction timed out, fill configuration was not saved.',
        components: [],
      })
    }
  })
}

async function find(
  interaction: ChatInputCommandInteraction,
  strago: Strago,
  lfgMessage: Message,
): Promise<void> {
  if (interaction.guild === null) return

  const emojis = interaction.guild.emojis.cache

  const roleChoices = new StringSelectMenuBuilder()
    .setCustomId('roles')
    .setPlaceholder('What roles do you need?')
    .addOptions(
      Object.entries(fillData.roles).map(([id, data]) =>
        createOption(id, data, emojis),
      ),
    )
    .setMinValues(1)
    .setMaxValues(3)
  const contentChoices = new StringSelectMenuBuilder()
    .setCustomId('content')
    .setPlaceholder('Which content are you running?')
    .addOptions(
      Object.values(fillData.content)
        .reduce(
          (accumulator, contentData) =>
            accumulator.concat(
              Object.entries(contentData).map(([id, data]) =>
                createOption(id, data, emojis),
              ),
            ),
          [] as StringSelectMenuOptionBuilder[],
        )
        .reverse(),
    )
  const roleRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    roleChoices,
  )
  const contentRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      contentChoices,
    )
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('submit')
      .setLabel('Submit')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  )
  const response = await interaction.reply({
    content: `Select role and content.`,
    components: [roleRow, contentRow, buttonRow],
    ephemeral: true,
  })
  const collector = response.createMessageComponentCollector({
    time: 60000,
  })

  let selectedRoles: string[] = []
  let selectedContent: { id: string; label: string }

  collector.on('collect', async (i) => {
    if (i.customId === 'cancel') {
      await i.update({
        content: 'Canceled fill request.',
        components: [],
      })
      collector.stop()
    } else if (i.customId === 'submit') {
      if (selectedRoles.length === 0 || selectedContent === undefined) {
        await i.reply({
          content:
            "Error: You need to select at least one role and the content for which you're requesting a fill.",
          ephemeral: true,
        })
      } else {
        const lfgChannel = interaction.channel
        // Try to find the last message sent in channel.
        if (
          lfgChannel !== null &&
          !lfgChannel.isDMBased() &&
          !lfgChannel.isThread()
        ) {
          const fillChannel = strago.channels.cache.get(
            strago.config.fillChannelId,
          )
          if (fillChannel === undefined || !fillChannel.isSendable()) return

          const embed = new EmbedBuilder()
            .setTitle('New Fill Request')
            .setDescription(
              `${interaction.user} has created a new fill request.`,
            )
            .addFields(
              {
                name: 'Roles',
                value: `${selectedRoles
                  .map((r) => idLabels.get(r) as string)
                  .join(', ')}`,
                inline: true,
              },
              {
                name: 'Content',
                value: `${selectedContent.label}`,
                inline: true,
              },
              {
                name: `Last Message: ${lfgMessage.url}`,
                value: `${lfgMessage.content}`,
              },
            )

          const fills = await Fill.find({
            [selectedContent.id]: true,
            enabled: true,
            $or: selectedRoles.map((r) => ({ [r]: true })),
          })
          const users = await Promise.all(
            fills.map(
              async (f) =>
                await interaction.guild?.members.fetch(f.get('discordId')),
            ),
          )
          // Filter users that are not in the given LFG channel.
          const validFills = users.filter((u) => {
            if (u === undefined || lfgChannel.members.get(u.id) === undefined)
              return false
            // Special case needed for Liam in all channels.
            // Might add specific channel registration for filling in the future if needed.
            const liamId = '103297791110959104'
            const naChannels = [
              'aether-lfg',
              'crystal-lfg',
              'dynamis-lfg',
              'primal-lfg',
              'na-static-recruitment',
            ]
            if (u.id === liamId) {
              if (!naChannels.includes(lfgChannel.name)) {
                return false
              }
            }
            return true
          })

          await fillChannel.send({
            content: `${validFills.map((m) => `${m}`).join('')}`,
            embeds: [embed],
          })
          if (validFills.length === 0) {
            await i.update({
              content:
                'There are currently no active fillers available for that role/content, but I submitted a fill request in case someone sees it, anyway.',
              components: [],
            })
          } else {
            await i.update({
              content: `Submitted fill request to ${
                validFills.length
              } potential fill${
                validFills.length > 1 ? 's' : ''
              }. If they're interested, they will reach out to you.`,
              components: [],
            })
          }
          strago.fillSpamSet.add(interaction.user.id)
        }
        collector.stop()
      }
    } else if (i.componentType === ComponentType.StringSelect) {
      // Update selected data.
      await i.deferUpdate()
      if (i.customId === 'roles') {
        selectedRoles = i.values
      } else if (i.customId === 'content') {
        selectedContent = {
          id: i.values[0],
          label: idLabels.get(i.values[0]) as string,
        }
      }
    }
  })

  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      await response.edit({
        content: 'Request timed out without being submitted.',
        components: [],
      })
    }
  })
}

/**
 * Entrypoint for various fill subcommands.
 * Subcommands:
 *   on: enables fill notifications
 *   off: disables fill notifications
 *   roles: displays buttons for toggling fill roles
 *   find: displays prompt for finding a fill
 */
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
  preregister: async (): Promise<void> => {
    Object.entries(fillData.roles).forEach(([id, role]) => {
      idLabels.set(id, role.label)
    })
    Object.values(fillData.content).forEach((contentData) => {
      Object.entries(contentData).forEach(([id, data]) => {
        idLabels.set(id, data.label)
      })
    })
  },
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
          ephemeral: true,
        })
        return
      }
      // Check if user recently ran command.
      if (strago.fillSpamSet.has(interaction.user.id)) {
        await interaction.reply({
          content:
            "You're doing that too quickly, wait at least ten minutes and try again.",
          ephemeral: true,
        })
        return
      } else {
        const lfgMessage = (
          await interaction.channel.messages.fetch({
            around: interaction.id,
          })
        ).find((m) => m.author === interaction.user)
        if (lfgMessage === undefined || lfgMessage.content === '') {
          await interaction.reply({
            content:
              "I couldn't find a recent message from you in this channel, please post a message before looking for a fill.",
            ephemeral: true,
          })
          return
        }
        await find(interaction, strago, lfgMessage)
      }
    } else {
      // Get user's fill data or create default.
      const fill: Document<IFill> = await Fill.findOneAndUpdate(
        { discordId: interaction.user.id },
        { $setOnInsert: { discordId: interaction.user.id } },
        { new: true, setDefaultsOnInsert: true, upsert: true },
      )
      if (command === 'on') {
        fill.set('enabled', true)
        await fill.save()
        await interaction.reply({
          content: 'Turned fill notifications on.',
          ephemeral: true,
        })
        const member = await interaction.guild.members.fetch(
          interaction.user.id,
        )
        const fillRole = interaction.guild.roles.cache.find(
          (r) => r.name === 'Fill',
        ) as Role
        member.roles.add(fillRole)
      } else if (command === 'off') {
        fill.set('enabled', false)
        await fill.save()
        await interaction.reply({
          content: 'Turned fill notifications off.',
          ephemeral: true,
        })
        const member = await interaction.guild.members.fetch(
          interaction.user.id,
        )
        const fillRole = interaction.guild.roles.cache.find(
          (r) => r.name === 'Fill',
        ) as Role
        member.roles.remove(fillRole)
      } else if (command === 'roles') {
        await roles(interaction, fill)
      }
    }
  },
  guildCommand: true,
}
