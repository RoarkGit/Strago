import { EmbedBuilder } from 'discord.js'

import * as weeklyTargets from '../data/weeklyTargets.json'

const MS_IN_WEEK = 1000 * 60 * 60 * 24 * 7
const ROTATION_START = new Date(Date.UTC(2021, 1, 2, 8))

/**
 * Generates an embed containing weekly targets to be used in messages.
 * @param weeks number of weeks away from current week to search
 * @returns a message embed containing the weekly targets info
 */
export const generateWeeklyTargetsEmbed = (weeks: number): EmbedBuilder => {
  const numWeeks =
    Math.floor((Date.now().valueOf() - ROTATION_START.valueOf()) / MS_IN_WEEK) +
    weeks
  const carnivaleTargets = Object.values(weeklyTargets.carnivale).map(
    (t) => t[numWeeks % t.length],
  )
  const duties = Object.values(weeklyTargets.duties)
    .map((t) => `<:logTarget:943678198116384768> ${t[numWeeks % t.length]}`)
    .filter((t) => !t.includes('???'))
    .join('\n')
  const primes = Object.values(weeklyTargets.primes)
    .map((t) => `<:primeTarget:943678179007143947> ${t[numWeeks % t.length]}`)
    .filter((t) => !t.includes('???'))
    .join('\n')
  return new EmbedBuilder()
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
        value: `:third_place: ${carnivaleTargets[0]}\n:second_place: ${carnivaleTargets[1]}\n:first_place: ${carnivaleTargets[2]}`,
        inline: false,
      },
      { name: '__Blue Mage Log Targets__', value: duties, inline: false },
      { name: '__Blue Mage Prime Targets__', value: primes, inline: false },
    )
}
