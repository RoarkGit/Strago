import { REST } from '@discordjs/rest'
import {
  type RESTPostAPIApplicationCommandsJSONBody,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from 'discord.js'

import type { Strago } from '../interfaces/Strago'

/**
 * Attempts to register all Commands in the commands folder.
 * @param strago Strago client instance
 * @returns Whether or not the commands were successfully registered.
 */
export const registerCommands = async (strago: Strago): Promise<boolean> => {
  try {
    const rest = new REST({ version: '10' }).setToken(strago.config.token)

    const globalCommandData: Array<
      | RESTPostAPIApplicationCommandsJSONBody
      | RESTPostAPIChatInputApplicationCommandsJSONBody
    > = []
    const guildCommandData: Array<
      | RESTPostAPIApplicationCommandsJSONBody
      | RESTPostAPIChatInputApplicationCommandsJSONBody
    > = []

    strago.commands.forEach((command) => {
      const data = command.data.toJSON()

      if (command.guildCommand) {
        guildCommandData.push(data)
      } else {
        globalCommandData.push(data)
      }
    })

    strago.logger.info('Registering global commands.')
    await rest.put(Routes.applicationCommands(strago.config.id), {
      body: globalCommandData,
    })

    strago.logger.info('Registering guild commands.')
    await rest.put(
      Routes.applicationGuildCommands(
        strago.config.id,
        strago.config.homeGuildId,
      ),
      {
        body: guildCommandData,
      },
    )

    return true
  } catch (error) {
    strago.logger.error('Failed to register commands:', error)
    return false
  }
}
