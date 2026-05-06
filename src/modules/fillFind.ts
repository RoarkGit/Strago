import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  Collection,
  ComponentType,
  EmbedBuilder,
  type GuildEmoji,
  type Message,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'

import { LIAM_ID, NA_LFG_CHANNELS } from '../constants/bot'
import fillData from '../data/fillData.json'
import Fill from '../interfaces/models/Fill'
import type { Strago } from '../interfaces/Strago'

// Built eagerly from static data so no preregister() side-effect is needed.
const idLabels = new Map<string, string>([
  ...Object.entries(fillData.roles).map(
    ([id, data]) => [id, data.label] as [string, string],
  ),
  ...Object.values(fillData.content).flatMap((contentData) =>
    Object.entries(contentData).map(
      ([id, data]) => [id, data.label] as [string, string],
    ),
  ),
])

function createOption(
  id: string,
  data: { label: string; emoji?: string; guildEmoji?: string },
  emojis: Collection<string, GuildEmoji>,
): StringSelectMenuOptionBuilder {
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

export async function findFill(
  interaction: ChatInputCommandInteraction,
  strago: Strago,
  lfgMessage: Message,
): Promise<void> {
  if (interaction.guild === null || !strago.config.fillChannelId) return

  const emojis = interaction.guild.emojis.cache

  const roleRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('roles')
      .setPlaceholder('What roles do you need?')
      .addOptions(
        Object.entries(fillData.roles).map(([id, data]) =>
          createOption(id, data, emojis),
        ),
      )
      .setMinValues(1)
      .setMaxValues(3),
  )
  const contentRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('content')
        .setPlaceholder('Which content are you running?')
        .addOptions(
          Object.values(fillData.content)
            .reduce(
              (acc, contentData) =>
                acc.concat(
                  Object.entries(contentData).map(([id, data]) =>
                    createOption(id, data, emojis),
                  ),
                ),
              [] as StringSelectMenuOptionBuilder[],
            )
            .reverse(),
        ),
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
    content: 'Select role and content.',
    components: [roleRow, contentRow, buttonRow],
    ephemeral: true,
  })

  const collector = response.createMessageComponentCollector({ time: 60000 })

  let selectedRoles: string[] = []
  let selectedContent: { id: string; label: string } | undefined

  collector.on('collect', async (i) => {
    if (i.customId === 'cancel') {
      await i.update({ content: 'Canceled fill request.', components: [] })
      collector.stop()
      return
    }

    if (i.customId === 'submit') {
      if (selectedRoles.length === 0 || selectedContent === undefined) {
        await i.reply({
          content:
            "Error: You need to select at least one role and the content for which you're requesting a fill.",
          ephemeral: true,
        })
        return
      }

      const lfgChannel = interaction.channel
      if (
        lfgChannel === null ||
        lfgChannel.isDMBased() ||
        lfgChannel.isThread()
      )
        return

      const fillChannel = strago.channels.cache.get(
        strago.config.fillChannelId as string,
      )
      if (fillChannel === undefined || !fillChannel.isSendable()) return

      const embed = new EmbedBuilder()
        .setTitle('New Fill Request')
        .setDescription(`${interaction.user} has created a new fill request.`)
        .addFields(
          {
            name: 'Roles',
            value: selectedRoles
              .map((r) => idLabels.get(r) as string)
              .join(', '),
            inline: true,
          },
          { name: 'Content', value: selectedContent.label, inline: true },
          {
            name: `Last Message: ${lfgMessage.url}`,
            value: lfgMessage.content,
          },
        )

      const fills = await Fill.find({
        [selectedContent.id]: true,
        enabled: true,
        $or: selectedRoles.map((r) => ({ [r]: true })),
      })
      const users = await Promise.all(
        fills.map(async (f) =>
          interaction.guild?.members.fetch(f.get('discordId')),
        ),
      )
      const validFills = users.filter((u) => {
        if (u === undefined || lfgChannel.members.get(u.id) === undefined)
          return false
        // Liam is exempt from single-datacenter restrictions.
        if (u.id === LIAM_ID && !NA_LFG_CHANNELS.includes(lfgChannel.name))
          return false
        return true
      })

      await fillChannel.send({
        content: validFills.map((m) => `${m}`).join(''),
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
          content: `Submitted fill request to ${validFills.length} potential fill${validFills.length > 1 ? 's' : ''}. If they're interested, they will reach out to you.`,
          components: [],
        })
      }

      strago.fillSpamSet.add(interaction.user.id)
      collector.stop()
      return
    }

    if (i.componentType === ComponentType.StringSelect) {
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
