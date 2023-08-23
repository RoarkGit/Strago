import type { Strago } from '../interfaces/Strago'

import type { AutocompleteInteraction, CommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js'

/**
 * Represents an abstract Slash command.
 */
export interface Command {
  /**
   * Command data (name, options, etc.).
   */
  data: Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'> | SlashCommandSubcommandsOnlyBuilder
  /**
   * Command action to run.
   */
  run: (interaction: CommandInteraction, strago: Strago) => Promise<void>
  autocomplete?: (strago: Strago, prefix: string, interaction: AutocompleteInteraction) => string[]
  guildCommand: boolean
};
