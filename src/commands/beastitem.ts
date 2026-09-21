import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js'

import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'
import { PATHS } from '../utils/paths'

const CATEGORY_COLORS: Record<string, number> = {
  'Beast Gear': 0xaaaaff,
  'Crucible Item': 0xaaffaa,
  Feed: 0xffaaaa,
}

function cleanField(text: string): string {
  return text.replace(/\n{2,}/g, '\n').trim()
}

export const beastitem: Command = {
  data: new SlashCommandBuilder()
    .setName('beastitem')
    .setDescription(
      'Retrieves information about a Beastmaster item (Beast Gear, Crucible Item, or Feed).',
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription("The item's name.")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    const name = interaction.options.getString('name', true).toLowerCase()

    const item = strago.data.itemData.get(name)
    if (item == null) {
      await interaction.reply({
        content: 'I could not locate that item.',
        ephemeral: true,
      })
      return
    }

    const attachment = new AttachmentBuilder(
      `${PATHS.itemImages()}/${item.id}.png`,
      { name: `${item.id}.png` },
    )

    // Components V2 rather than an embed: a section's thumbnail accessory floats the
    // icon to the right of the text it belongs to, matching /beast, and its text
    // renders markdown headings.
    const container = new ContainerBuilder()
      .setAccentColor(CATEGORY_COLORS[item.category] ?? 0xaaaaaa)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `## ${item.name}`,
                `**Category** ${item.category}`,
                item.sellPrice > 0
                  ? `**Sell Price** ${item.sellPrice} territory tokens`
                  : null,
              ]
                .filter((line) => line != null)
                .join('\n'),
            ),
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder()
              .setURL(`attachment://${item.id}.png`)
              .setDescription(`${item.name} icon`),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(cleanField(item.description)),
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '-# Information sourced from [Blue Academy](https://github.com/RoarkGit/Limited-Job-Data)',
        ),
      )

    await interaction.reply({
      components: [container],
      files: [attachment],
      flags: MessageFlags.IsComponentsV2,
    })
  },
  autocomplete: (strago: Strago, prefix: string): string[] =>
    strago.data.itemData
      .map((i) => i.name)
      .filter((n) => n.toLowerCase().includes(prefix.toLowerCase())),
  guildCommand: false,
}
