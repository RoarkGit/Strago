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

import type { Beast, BeastAction } from '../interfaces/Beast'
import type { Command } from '../interfaces/Command'
import type { Strago } from '../interfaces/Strago'
import { PATHS } from '../utils/paths'

const ELEMENT_COLORS: Record<string, number> = {
  Fire: 0xffaaaa,
  Water: 0xaaaaff,
  Wind: 0xaaffaa,
  Lightning: 0xffaaff,
  Ice: 0xffffff,
  Earth: 0xffffaa,
  Slashing: 0xc9b8a8,
  Piercing: 0xb8c4c9,
  Blunt: 0xb0b0b8,
  Unaspected: 0xaaaaaa,
}

// Unaspected damage has no glyph of its own; the game shows the magic glyph for it.
const ELEMENT_GLYPHS: Record<string, string> = { unaspected: 'magic' }

/**
 * The game's own inline element glyph, extracted from the font icon data. Returns a
 * trailing space so it can be prefixed directly, or nothing if it has not been uploaded.
 */
function elementEmoji(strago: Strago, element: string): string {
  const key = element.toLowerCase()
  const emoji = strago.data.emoji.get(ELEMENT_GLYPHS[key] ?? key)
  return emoji != null ? `${emoji} ` : ''
}

function cleanField(text: string): string {
  return text.replace(/\n{2,}/g, '\n').trim()
}

/**
 * Renders a beast's satiety and its five stat ratings from the Crucible of the
 * Unbroken, at the given rank (1-25). The rank is only called out in the text when
 * it is not 25, the default and the max, to keep the common case unchanged.
 */
function statsText(beast: Beast, rank: number): string {
  const [
    strength,
    intelligence,
    physicalResistance,
    magicalResistance,
    constitution,
  ] = beast.growth[rank - 1]

  const stats = [
    `**STR** ${strength}`,
    `**INT** ${intelligence}`,
    `**P.RES** ${physicalResistance}`,
    `**M.RES** ${magicalResistance}`,
    `**CON** ${constitution}`,
  ].join(' · ')

  return [
    rank === 25 ? stats : `${stats}  *(Rank ${rank})*`,
    `**Satiety** ${beast.satiety}`,
  ].join('\n')
}

/**
 * Renders one of a beast's actions: a heading carrying the game's own icon, the
 * action's name and its element, then its range and radius, then the full tooltip.
 */
function actionText(
  strago: Strago,
  action: BeastAction,
  emoji: string,
): string {
  const heading = [emoji !== '' ? `${emoji} ${action.name}` : action.name]
  if (action.element != null) {
    heading.push(`${elementEmoji(strago, action.element)}${action.element}`)
  }

  const meta = []
  if (action.range != null) meta.push(`**Range** ${action.range}y`)
  if (action.radius != null) meta.push(`**Radius** ${action.radius}y`)

  const lines = [`### ${heading.join(' · ')}`]
  if (meta.length > 0) lines.push(meta.join(' · '))
  lines.push(cleanField(action.description))

  return lines.join('\n')
}

export const beast: Command = {
  data: new SlashCommandBuilder()
    .setName('beast')
    .setDescription('Retrieves information about a given Beastmaster beast.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription("The beast's name.")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('rank')
        .setDescription("The beast's rank (1-25). Defaults to 25, the max.")
        .setMinValue(1)
        .setMaxValue(25)
        .setRequired(false),
    ),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    const name = interaction.options.getString('name', true).toLowerCase()
    const rank = interaction.options.getInteger('rank') ?? 25

    const beast: Beast | undefined = strago.data.beastData.get(name)
    if (beast == null) {
      await interaction.reply({
        content: 'I could not locate that beast.',
        ephemeral: true,
      })
      return
    }

    const attachment = new AttachmentBuilder(
      `${PATHS.beastImages()}/${beast.id}.png`,
      { name: `${beast.id}.png` },
    )

    // Components V2 rather than an embed: a section's thumbnail accessory floats the
    // portrait to the right of the text it belongs to, filling space an embed would
    // leave empty, and unlike an embed its text renders markdown headings.
    const container = new ContainerBuilder()
      .setAccentColor(ELEMENT_COLORS[beast.trick.element ?? ''] ?? 0xaaaaaa)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `## ${beast.number}: ${beast.name}`,
                `**Classification** ${beast.classification}`,
                `**Auto-attack** ${elementEmoji(strago, beast.autoAttack.element)}${beast.autoAttack.element} · ${beast.autoAttack.range}y`,
                `**Habitat** ${cleanField(beast.habitat)}`,
                statsText(beast, rank),
              ].join('\n'),
            ),
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder()
              .setURL(`attachment://${beast.id}.png`)
              .setDescription(`${beast.name} portrait`),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder())

    container
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          actionText(
            strago,
            beast.trick,
            strago.data.emoji.get(beast.trick.affinity?.toLowerCase() ?? '') ??
              '',
          ),
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          actionText(
            strago,
            beast.temperedRelease,
            strago.data.emoji.get('tempered_release') ?? '',
          ),
        ),
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
    strago.data.beastData
      .map((b) => b.name)
      .filter((n) => n.toLowerCase().includes(prefix.toLowerCase())),
  guildCommand: false,
}
