import { Strago } from "../interfaces/Strago";

import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, SlashCommandBuilder } from "discord.js";

import CharacterModel from "../database/models/CharacterModel";
import { Command } from "../interfaces/Command";
import * as xivlib from "../modules/xivlib";

/**
 * Converts a string to title case.
 * @param str the input string
 * @returns title cased version of str
 */
const titleCase = (str: string): string => {
    return str.toLowerCase().split(' ')
        .filter(s => s)
        .map(word => {
            return word.replace(word[0], word[0].toUpperCase());
        })
        .join(' ');
};

/**
 * Runs the character registration workflow.
 */
export const register: Command = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register a character with Strago for achievement scanning.")
        .addStringOption(option =>
            option.setName("character")
                  .setDescription("Your character's name.")
                  .setRequired(true))
        .addStringOption(option =>
            option.setName("server")
                  .setDescription("The server (e.g. Balmung) on which your character resides.")
                  .setRequired(true)),
    run: async (interaction: CommandInteraction, strago: Strago): Promise<void> => {
        try {
            // This line is needed to access interaction options.
            if (!interaction.isChatInputCommand()) return;

            const member = await interaction.guild!.members.fetch(interaction.user.id);

            await interaction.reply({ content: 'Searching for character...', ephemeral: true });
            const character = titleCase(interaction.options.getString("character", true));
            const server = titleCase(interaction.options.getString("server", true));
            strago.logger.info(`Registration attempt from ${member.nickname || member.user.username} for ${character}@${server}.`)
            const challenge = xivlib.generateChallenge(character, server);
            const characterId = await xivlib.getCharacterId(character, server);
            
            if (characterId == "-1") {
                interaction.editReply({ content: 'I was unable to locate that character.' });
                return;
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId('verify')
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Primary));

            const filter = (i: ButtonInteraction): boolean => {
                return i.customId === 'verify';
            };

            interaction.channel!.awaitMessageComponent({ filter } as any)
                .then(async i => {
                    if (await xivlib.verifyCharacter(characterId)) {
                        strago.logger.info(`Successfully registered ${characterId}`);
                        await interaction.editReply({ content: 'You have successfully registered your character!', components: [] });
                        await CharacterModel.create({ discordId: i.user.id, characterId: characterId, characterName: character });
                    } else {
                        strago.logger.info(`Registration failed for ${characterId}`);
                        await interaction.editReply({ content: 'I could not verify the challenge on your Lodestone profile.', components: [] });
                    }})
                .catch(err => strago.logger.error(err));
            
            await interaction.editReply({
                content: [`I found this character: <${xivlib.getUrl([characterId])}>`,
                          'Please update your character profile to include this challenge: ',
                          `\`\`\`${challenge}\`\`\``,
                          'Once finished, please click the Verify button to begin verification.']
                          .join('\n'),
                components: [row],
                ephemeral: true} as any
            );
        } catch (error) {
            strago.logger.error(error);
        }
    },
};