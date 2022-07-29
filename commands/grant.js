const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const xivlib = require('../libs/xivlib')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grant')
        .setDescription('Grant achievement-based roles for which you are eligible.'),
        async execute(interaction, client) {
            console.log(`Grant command from ${interaction.member.nickname || interaction.user.username}`);
            await interaction.reply({ content: 'Checking registration...', ephemeral: true });
            const character = await client.characters.findOne({
                where: {
                    discordId: interaction.user.id
                },
            });
            if (character === null) {
                return interaction.editReply({ content: 'Unable to find registered character. Try running `/register`.', ephemeral: true })
            }

            let lines = [];

            const updateState = async (line) => {
                console.log(line);
                lines.push(line);
                await interaction.editReply({ content: lines.join('\n'), ephemeral: true })
            };

            updateState(`Beginning achievement scan for ${character.characterName}...`);

            const granted = new Set();
            const characterAchievements = await xivlib.getAchievementsComplete(
                character.characterId, Object.keys(client.achievementData.achievementIds));

            client.achievementData.roles.forEach((role) => {
                const discordRole = interaction.guild.roles.cache.find(r => r.name === role.name);

                // Check for blocking roles first.
                let blockers = [];

                role.blockedBy.forEach((blocker) => {
                    if (granted.has(blocker) || interaction.member.roles.cache.some(r => r.name === blocker)) {
                        blockers.push(blocker);
                    }
                });

                if (blockers.length > 0) {
                    updateState(`${role.name}: You already have ${blockers.join(', ')}`)
                    interaction.member.roles.remove(discordRole);
                    return;
                }

                // Check if role already exists.
                if (interaction.member.roles.cache.some(r => r.name === role.name)) {
                    updateState(`${role.name}: You already have it!`);
                    return;
                }

                updateState(`Checking eligibility for ${role.name}`);

                // Check for completed achievements.
                let missing = [];
                role.required.forEach((achievement) => {
                    if (!characterAchievements.has(achievement)) {
                        missing.push(client.achievementData.achievementIds[achievement]);
                    }
                });

                if (missing.length > 0) {
                    updateState(`Skipping ${role.name} since you are missing: ${missing.join(', ')}`)
                    return;
                }

                updateState(`${role.name}: Granted!`);
                interaction.member.roles.add(discordRole);
                granted.add(role.name);

                // Special case for Blue Legend
                if (role.name === 'Blue Legend') {
                    const channel = interaction.guild.channels.cache.find(c => c.name === "general");
                    channel.send(`<:academyCool:926176707302535188> ${interaction.member} has ascended to the status of ${discordRole}! <:academyCool:926176707302535188>`);
                }
            });
        },
};