import { Strago } from "../interfaces/Strago";

import { CommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

export interface Command {
    data: 
        | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
        | SlashCommandSubcommandsOnlyBuilder,
    run: (interaction: CommandInteraction, strago: Strago) => Promise<void>;
};