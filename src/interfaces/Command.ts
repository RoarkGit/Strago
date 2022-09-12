import { Strago } from "../interfaces/Strago";

import { AutocompleteInteraction, CommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

/**
 * Represents an abstract Slash command.
 */
export interface Command {
    /**
     * Command data (name, options, etc.).
     */
    data: 
        | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
        | SlashCommandSubcommandsOnlyBuilder,
    /**
     * Command action to run.
     */
    run: (interaction: CommandInteraction, strago: Strago) => Promise<void>,
    autocomplete?: (interaction: AutocompleteInteraction, strago: Strago) => Promise<void>;
};