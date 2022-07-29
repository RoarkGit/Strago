const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const xivlib = require('../libs/xivlib')

const titleCase = (str) => {
    return str.toLowerCase().split(' ')
        .filter(s => s)
        .map(word => {
            return word.replace(word[0], word[0].toUpperCase());
        })
        .join(' ');
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register a character with the bot for achievement scanning.')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Your character\'s name.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('server')
                .setDescription('The server (e.g. Balmung) on which your character resides.')
                .setRequired(true)),
        async execute(interaction, client) {
            await interaction.reply({ content: 'Searching for character...', ephemeral: true });
            const character = titleCase(interaction.options.getString('character'));
            const server = titleCase(interaction.options.getString('server'));
            console.log(`Registration attempt from ${interaction.member.nickname || interaction.user.username} for ${character}@${server}.`)
            const challenge = xivlib.generateChallenge(character, server);
            const characterId = await xivlib.getCharacterId(character, server);
            
            if (characterId == -1) {
                console.log('Couldn\t find character');
                return interaction.editReply({ content: 'I was unable to locate that character.' });
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId('verify')
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Primary));

            const filter = i => {
                i.deferUpdate();
                return i.customId === 'verify';
            };

            interaction.channel.awaitMessageComponent({ filter })
                .then(async i => {
                    if (await xivlib.verifyCharacter(characterId)) {
                        console.log(`Successfully registered ${characterId}`);
                        await i.editReply({ content: 'You have successfully registered your character!', components: []});
                        await client.characters.upsert({ discordId: i.user.id, characterId: characterId, characterName: character });
                    } else {
                        console.log(`Registration failed ${characterId}`);
                        await i.editReply({ content: 'I could not verify the challenge on your Lodestone profile.', components: []});
                    }})
                .catch(err => console.error(err));
            
            await interaction.editReply({
                content: [`I found this character: <${xivlib.getUrl([characterId])}>`,
                          'Please update your character profile to include this challenge: ',
                          `\`\`\`${challenge}\`\`\``,
                          'Once finished, please click the Verify button to begin verification.']
                          .join('\n'),
                components: [row],
                ephemeral: true}
            );
        },
};