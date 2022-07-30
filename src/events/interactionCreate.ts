import { Interaction } from "discord.js";

import { Strago } from "../interfaces/Strago";

export const interactionCreate = async (interaction: Interaction, strago: Strago): Promise<void> => {
    if (interaction.isChatInputCommand()) {
        const command = strago.commands.get(interaction.commandName);

        if (!command) return;

        await command.run(interaction, strago);
    }
};