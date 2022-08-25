import { Strago } from "../interfaces/Strago";

import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { Command } from "../interfaces/Command";

/**
 * Retrieves list of all users whose name starts with a provided string and provides an option to ban them.
 */
export const bulkban: Command = {
    data: new SlashCommandBuilder()
        .setName("bulkban")
        .setDescription("Bans all users whose name starts with a given prefix.")
        .addStringOption(option =>
            option.setName("prefix")
                  .setDescription("The prefix to ban.")
                  .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    run: async (interaction: CommandInteraction, strago: Strago): Promise<void> => {
        if (!interaction.isChatInputCommand()) return;

        const members = await interaction.guild!.members.fetch();
        const prefix = interaction.options.getString("prefix", true);
        const filtered = members.filter(m => m.user.username.startsWith(prefix));

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId(interaction.user.id)
            .setLabel('Ban')
            .setStyle(ButtonStyle.Primary));

        const filter = (i: ButtonInteraction): boolean => {
            return i.customId === i.user.id;
        };

        interaction.channel!.awaitMessageComponent({ filter } as any)
            .then(async i => {
                filtered.forEach(m => m.ban());
                await interaction.editReply({ components: [] });
            })
            .catch(err => strago.logger.error(err));


        // Only list unique usernames, check if message length exceeds 2000.
        const usernames = new Set();
        filtered.forEach(m => usernames.add(m.user.username.split("#")[0]));

        let usernameString = "I found these users:\n" + Array.from(usernames).join("\n");
        if (usernameString.length > 2000) {
            usernameString = "There were too many usernames to list. Ban anyway?";
        }
        
        await interaction.reply({
            content: usernameString,
            components: [row]} as any
        );
    }
};