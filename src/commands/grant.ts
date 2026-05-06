import {
  type ChatInputCommandInteraction,
  type GuildMemberRoleManager,
  SlashCommandBuilder,
  type TextChannel,
} from 'discord.js'

import { ACADEMY_LEGEND_EMOJI, BLUE_LEGEND_ROLE } from '../constants/bot'
import achievementData from '../data/achievementData.json'
import type { Command } from '../interfaces/Command'
import Character from '../interfaces/models/Character'
import type { Strago } from '../interfaces/Strago'
import * as xivlib from '../modules/xivlib'

type RoleData = (typeof achievementData.roles)[number]

type EligibilityResult =
  | { status: 'blocked'; blockers: string[] }
  | { status: 'missing'; missing: string[]; tooMany: boolean }
  | { status: 'already_has' }
  | { status: 'eligible' }

const checkEligibility = (
  role: RoleData,
  memberRoles: GuildMemberRoleManager,
  characterAchievements: Set<string>,
  granted: Set<string>,
): EligibilityResult => {
  const blockers = role.blockedBy.filter(
    (b) => granted.has(b) || memberRoles.cache.some((r) => r.name === b),
  )
  if (blockers.length > 0) return { status: 'blocked', blockers }

  const missing = role.required
    .filter((a) => !characterAchievements.has(a))
    .map(
      (a) =>
        achievementData.achievementIds[
          a as keyof typeof achievementData.achievementIds
        ],
    )
  if (missing.length > 0)
    return { status: 'missing', missing, tooMany: missing.length > 3 }

  if (memberRoles.cache.some((r) => r.name === role.name))
    return { status: 'already_has' }

  return { status: 'eligible' }
}

export const grant: Command = {
  data: new SlashCommandBuilder()
    .setName('grant')
    .setDescription(
      'Grant achievement-based roles for which you are eligible.',
    ),
  run: async (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ): Promise<void> => {
    try {
      if (interaction.guild === null) return

      const guild = interaction.guild
      const member = await guild.members.fetch(interaction.user.id)

      if (strago.grantSpamSet.has(member.id)) {
        await interaction.reply({
          content:
            "You're doing that too quickly, wait at least ten minutes and try again.",
          ephemeral: true,
        })
        return
      }
      strago.grantSpamSet.add(member.id)

      await interaction.reply({
        content: 'Checking registration...',
        ephemeral: true,
      })
      const character = await Character.findOne({
        discordId: interaction.user.id,
      })

      if (character === null) {
        await interaction.editReply({
          content:
            'Unable to find registered character. Try running `/register`.',
        })
        return
      }

      const achievementsPublic = await xivlib.getAchievementsPublic(
        character.characterId as string,
      )
      if (!achievementsPublic) {
        await interaction.editReply({
          content:
            'I could not view your achievements, please make sure they are public and try again.',
        })
        return
      }

      const lines: string[] = []
      const updateState = async (line: string): Promise<void> => {
        strago.logger.info(line)
        lines.push(line)
        await interaction.editReply({ content: lines.join('\n') })
      }

      await updateState(
        `Beginning achievement scan for ${character.characterName as string}...`,
      )

      const granted = new Set<string>()
      const characterAchievements = await xivlib.getAchievementsComplete(
        character.characterId,
        Object.keys(achievementData.achievementIds),
      )
      const memberRoles = member.roles as GuildMemberRoleManager

      for (const role of achievementData.roles) {
        const discordRole = guild.roles.cache.find((r) => r.name === role.name)
        if (discordRole === undefined) {
          strago.logger.error(`Undefined role: ${role.name}`)
          continue
        }

        const eligibility = checkEligibility(
          role,
          memberRoles,
          characterAchievements,
          granted,
        )
        const hasRole = memberRoles.cache.some((r) => r.name === role.name)

        if (eligibility.status === 'blocked') {
          await updateState(
            `${role.name}: You already have ${eligibility.blockers.join(', ')}`,
          )
          if (hasRole) await memberRoles.remove(discordRole)
          continue
        }

        await updateState(`Checking eligibility for ${role.name}`)

        if (eligibility.status === 'missing') {
          const msg = eligibility.tooMany
            ? `Skipping ${role.name} since you are missing many achievements!`
            : `Skipping ${role.name} since you are missing: ${eligibility.missing.join(', ')}`
          await updateState(msg)
          if (hasRole) await memberRoles.remove(discordRole)
          continue
        }

        if (eligibility.status === 'already_has') {
          await updateState(`${role.name}: You already have it!`)
          continue
        }

        await updateState(`${role.name}: Granted!`)
        await memberRoles.add(discordRole)
        granted.add(role.name)

        if (role.name === BLUE_LEGEND_ROLE) {
          const channel = guild.channels.cache.find(
            (c) => c.name === 'general',
          ) as TextChannel
          await channel.send(
            `${ACADEMY_LEGEND_EMOJI} ${member.toString()} has ascended to the status of ${discordRole}! ${ACADEMY_LEGEND_EMOJI}`,
          )
        }
      }
    } catch (error) {
      strago.logger.error('Failed to grant roles', error)
      await interaction.editReply(
        'I encountered an error trying to retrieve your achievements.\n' +
          'Please try again and if the issue persists contact Liam Galt.',
      )
    }
  },
  guildCommand: true,
}
