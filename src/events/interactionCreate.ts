import { Strago } from "../interfaces/Strago";

import { Interaction } from "discord.js";

/**
 * Handles slash command interaction.
 * @param interaction the interaction that triggered the event
 * @param strago Strago client instance
 */
export const interactionCreate = async (interaction: Interaction, strago: Strago) => {
    if (interaction.isChatInputCommand()) {
        const command = strago.commands.get(interaction.commandName);

        if (!command) return;

        await command.run(interaction, strago);
    }
};