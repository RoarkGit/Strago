import { Strago } from '../interfaces/Strago'

import { CommandInteraction, GuildMemberRoleManager, SlashCommandBuilder, TextChannel } from 'discord.js'

import CharacterModel from '../database/models/CharacterModel'
import { Command } from '../interfaces/Command'
import * as xivlib from '../modules/xivlib'

/**
 * Runs the grant workflow:
 *   1. Checks for registration
 *   2. Checks that achievements are visible
 *   3. Checks achievement completion for achievements stored in achievementData.
 *   4. Grants/revokes achievements according to completion and role blockers.
 */
export const grant: Command = {
  data: new SlashCommandBuilder()
    .setName('grant')
    .setDescription('Grant achievement-based roles for which you are eligible.'),
  run: async (interaction: CommandInteraction, strago: Strago): Promise<void> => {
    try {
      if (interaction.guild === null) return
      const guild = interaction.guild
      const member = await guild.members.fetch(interaction.user.id)
      await interaction.reply({ content: 'Checking registration...', ephemeral: true })
      const character = await CharacterModel.findOne({
        discordId: interaction.user.id
      })

      if (character === null) {
        await interaction.editReply({ content: 'Unable to find registered character. Try running `/register`.' })
        return
      }

      const achievementsPublic = await xivlib.getAchievementsPublic(character.get('characterId') as string)

      if (!achievementsPublic) {
        await interaction.editReply({ content: 'I could not view your achievements, please make sure they are public and try again.' })
        return
      }

      const lines: string[] = []

      const updateState = async (line: string): Promise<void> => {
        strago.logger.info(line)
        lines.push(line)
        await interaction.editReply({ content: lines.join('\n') })
      }

      const characterName: string = character.get('characterName') as string
      await updateState(`Beginning achievement scan for ${characterName}...`)

      const granted = new Set<string>()
      const characterAchievements = await xivlib.getAchievementsComplete(
        character.get('characterId') as string, Object.keys(strago.data.achievementData.achievementIds))
      const memberRoles: GuildMemberRoleManager = member.roles

      await Promise.all(strago.data.achievementData.roles.map(async (role) => {
        const discordRole = guild.roles.cache.find(r => r.name === role.name)
        if (discordRole === undefined) {
          strago.logger.error(`Undefined role: ${role.name}`)
          return
        }

        // Check for blocking roles first.
        const blockers: string[] = []

        role.blockedBy.forEach((blocker) => {
          if (granted.has(blocker) || memberRoles.cache.some(r => r.name === blocker)) {
            blockers.push(blocker)
          }
        })

        if (blockers.length > 0) {
          await updateState(`${role.name}: You already have ${blockers.join(', ')}`)
          await memberRoles.remove(discordRole)
          return
        }

        // Check if role already exists.
        if (memberRoles.cache.some(r => r.name === role.name)) {
          await updateState(`${role.name}: You already have it!`)
          return
        }

        await updateState(`Checking eligibility for ${role.name}`)

        // Check for completed achievements.
        const missing: string[] = []
        role.required.forEach((achievement) => {
          if (!characterAchievements.has(achievement)) {
            missing.push(strago.data.achievementData.achievementIds[achievement])
          }
        })

        if (missing.length > 0) {
          await updateState(`Skipping ${role.name} since you are missing: ${missing.join(', ')}`)
          return
        }

        await updateState(`${role.name}: Granted!`)
        await memberRoles.add(discordRole)
        granted.add(role.name)

        // Special case for Blue Legend
        if (role.name === 'Blue Legend') {
          const channel = guild.channels.cache.find(c => c.name === 'general') as TextChannel
          const role: string = discordRole?.toString() as string
          await channel.send(`<:academyCool:926176707302535188> ${member.toString()} has ascended to the status of ${role}! <:academyCool:926176707302535188>`)
        }
      }))
    } catch (error) {
      strago.logger.error('Failed to grant roles', error)
      await interaction.editReply('I encountered an error trying to retrieve your achievements.\n' +
                                        'Please try again and if the issue persists contact Liam Galt.')
    }
  },
  guildCommand: true
}
