import { type Strago } from '../interfaces/Strago'

import { type Interaction, InteractionType } from 'discord.js'

/**
 * Handles slash command interaction.
 * @param interaction the interaction that triggered the event
 * @param strago Strago client instance
 */
export const interactionCreate = async (interaction: Interaction, strago: Strago): Promise<void> => {
  if (interaction.isChatInputCommand()) {
    const command = strago.commands.get(interaction.commandName)

    if (command === undefined) return

    // Log command usage with entered options.
    const user = await strago.users.fetch(interaction.user.id)
    const options: Record<string, string | number | boolean | undefined> = {}
    interaction.options.data.forEach(o => { options[o.name] = o.value })
    const logMessage: any = {
      message: 'Processing command',
      command: interaction.commandName,
      options,
      user: {
        userTag: user.tag,
        userId: user.id
      },
      guild: {
        guildName: null,
        guildId: null
      }
    }
    if (interaction.guild !== null) {
      logMessage.guild.guildName = interaction.guild.name
      logMessage.guild.guildId = interaction.guild.id
    }
    strago.logger.info(logMessage)

    await command.run(interaction, strago)
  } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
    const command = strago.commands.get(interaction.commandName)

    if ((command == null) || (command.autocomplete == null)) return

    const prefix = interaction.options.getFocused()
    const choices = command.autocomplete(strago, prefix, interaction)
    choices.sort()

    await interaction.respond(choices.slice(0, 25).map(c => ({ name: c, value: c })))
  }
}
