import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js'

import { LOG_TARGET_EMOJI, PRIME_TARGET_EMOJI } from '../constants/bot'
import { ONE_WEEK_MS } from '../constants/time'
import type {
  CarnivaleTarget,
  WeeklyTargets,
} from '../interfaces/WeeklyTargets'

const ROTATION_START = new Date(Date.UTC(2021, 1, 2, 8))

// Weeks can be requested far enough in the past to make numWeeks negative,
// which a bare % would turn into a negative index.
function rotate(numWeeks: number, length: number): number {
  return ((numWeeks % length) + length) % length
}

// Thumbnails are addressed by bare video ID, but the data stores watch URLs.
// Accepts both the youtu.be and the youtube.com/watch?v= forms.
function youTubeThumbnail(url: string): string | undefined {
  const id = /(?:youtu\.be\/|[?&]v=)([\w-]{11})(?![\w-])/.exec(url)?.[1]
  // hqdefault exists for every upload; maxresdefault only for 720p and better.
  return id && `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

function formatCarnivale(target: CarnivaleTarget): string {
  if (!target.bonuses?.length) return target.name
  return `${target.name} (${target.bonuses.join(', ')})`
}

export interface WeeklyTargetsMessage {
  embeds: EmbedBuilder[]
  components: ActionRowBuilder<ButtonBuilder>[]
}

export const generateWeeklyTargetsMessage = (
  weeklyTargets: WeeklyTargets,
  weeks: number,
): WeeklyTargetsMessage => {
  const numWeeks =
    Math.floor(
      (Date.now().valueOf() - ROTATION_START.valueOf()) / ONE_WEEK_MS,
    ) + weeks
  const carnivaleTargets = Object.values(weeklyTargets.carnivale).map(
    (t) => t[rotate(numWeeks, t.length)],
  )
  const duties = Object.values(weeklyTargets.duties)
    .map((t) => `${LOG_TARGET_EMOJI} ${t[rotate(numWeeks, t.length)]}`)
    .filter((t) => !t.includes('???'))
    .join('\n')
  const primes = Object.values(weeklyTargets.primes)
    .map((t) => `${PRIME_TARGET_EMOJI} ${t[rotate(numWeeks, t.length)]}`)
    .filter((t) => !t.includes('???'))
    .join('\n')
  const videoUrl =
    weeklyTargets.videos[rotate(numWeeks, weeklyTargets.videos.length)]
  const embed = new EmbedBuilder()
    .setTitle('Blue Mage Weekly Targets')
    .setDescription(
      '[Challenge descriptions/explanations](https://discord.com/channels/762797677133561887/943624070069633085/970802848558350426)',
    )
    .setAuthor({
      name: 'Blue Academy',
      iconURL: 'https://i.imgur.com/y8SyjUa.png',
      url: 'https://discord.gg/blueacademy',
    })
    .addFields(
      {
        name: '__Masked Carnivale Targets__',
        value: `:third_place: ${formatCarnivale(carnivaleTargets[0])}\n:second_place: ${formatCarnivale(carnivaleTargets[1])}\n:first_place: ${formatCarnivale(carnivaleTargets[2])}`,
        inline: false,
      },
      { name: '__Blue Mage Log Targets__', value: duties, inline: false },
      { name: '__Blue Mage Prime Targets__', value: primes, inline: false },
    )

  if (videoUrl) {
    embed.setURL(videoUrl)
    const thumbnail = youTubeThumbnail(videoUrl)
    if (thumbnail) embed.setThumbnail(thumbnail)
  }

  // A link button needs no custom ID and no interaction handler: it just opens the URL.
  const components = videoUrl
    ? [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setEmoji('▶️')
            .setLabel("Watch this week's guide")
            .setURL(videoUrl),
        ),
      ]
    : []

  return { embeds: [embed], components }
}
