import { Strago } from "../interfaces/Strago";

import { Interaction, InteractionType } from "discord.js";

/**
 * Handles slash command interaction.
 * @param interaction the interaction that triggered the event
 * @param strago Strago client instance
 */
export const interactionCreate = async (interaction: Interaction, strago: Strago) => {
    if (interaction.isChatInputCommand()) {
        if (!interaction.inGuild()) {
            await interaction.reply("Sorry, direct messages are unsupported!");
            return;
        }
        const command = strago.commands.get(interaction.commandName);

        if (!command) return;

        await command.run(interaction, strago);
    } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        const command = strago.commands.get(interaction.commandName);

        if (!command || !command.autocomplete) return;

        const prefix = interaction.options.getFocused();
        const choices = command.autocomplete(strago, prefix);
        choices.sort();

        await interaction.respond(choices.slice(0, 25).map(c => ({ name: c, value: c })));
    }
};