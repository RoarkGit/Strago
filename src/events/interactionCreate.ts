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
        
        // Log command usage with entered options.
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        const opts = interaction.options.data.map(o => o.name + ": " + o.value);
        strago.logger.info(`${member.nickname || member.user.username} executing ${interaction.commandName}(${opts.join(", ")})`);

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