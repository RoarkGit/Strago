import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  type MessageActionRowComponentBuilder,
} from 'discord.js'

import type { Strago } from '../interfaces/Strago'

export const confirmAction = async (
  interaction: ChatInputCommandInteraction,
  strago: Strago,
  content: string,
  label: string,
  onConfirm: () => Promise<void>,
): Promise<void> => {
  const row =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.user.id)
        .setLabel(label)
        .setStyle(ButtonStyle.Primary),
    )

  const message = await interaction.reply({ content, components: [row] })

  message
    .awaitMessageComponent({
      filter: (i) => i.customId === i.user.id,
      componentType: ComponentType.Button,
    })
    .then(onConfirm)
    .catch((err) => strago.logger.error(err))
}
