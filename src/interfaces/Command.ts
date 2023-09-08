import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'

import type { Strago } from '../interfaces/Strago'

/**
 * Represents an abstract Slash command.
 */
export interface Command {
  /**
   * Command data (name, options, etc.).
   */
  data:
    | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
    | SlashCommandSubcommandsOnlyBuilder
  /**
   * Command action to run.
   */
  run: (
    interaction: ChatInputCommandInteraction,
    strago: Strago,
  ) => Promise<void>
  autocomplete?: (
    strago: Strago,
    prefix: string,
    interaction: AutocompleteInteraction,
  ) => string[]
  guildCommand: boolean
}
