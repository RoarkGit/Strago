import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  Collection,
  ComponentType,
  type GuildEmoji,
  GuildMemberRoleManager,
} from 'discord.js'
import { type Document } from 'mongoose'

import { BLUE_LEGEND_ROLE } from '../constants/bot'
import fillData from '../data/fillData.json'
import { type IFill } from '../interfaces/models/Fill'

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
  button.setStyle(enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
  return button
}

export async function configureFillRoles(
  interaction: ChatInputCommandInteraction,
  fill: Document<IFill>,
): Promise<void> {
  if (interaction.guild === null || interaction.member === null) return

  const memberRoles = interaction.member.roles as GuildMemberRoleManager
  const emojis = interaction.guild.emojis.cache
  const legend = memberRoles.cache.some((r) => r.name === BLUE_LEGEND_ROLE)
  const buttons: Collection<string, ButtonBuilder> = new Collection()
  const rows: ActionRowBuilder<ButtonBuilder>[] = []

  Object.values(fillData.content).forEach((contentData) => {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        Object.entries(contentData).map(([id, data]) => {
          const button = createButton(id, data, emojis, fill.get(id))
          button.setDisabled(
            data.requiresRole !== undefined &&
              !legend &&
              !memberRoles.cache.some((r) => r.name === data.requiresRole),
          )
          buttons.set(id, button)
          return button
        }),
      ),
    )
  })

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      Object.entries(fillData.roles).map(([id, data]) => {
        const button = createButton(id, data, emojis, fill.get(id))
        buttons.set(id, button)
        return button
      }),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('save')
        .setLabel('Save')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Primary),
    ),
  )

  const response = await interaction.reply({
    content:
      'Click the buttons for content that you would like to fill for. You _must_ have the achievement-based roles from Strago to click the associated buttons.',
    components: rows,
    ephemeral: true,
  })

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
