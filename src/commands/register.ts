import { type Strago } from '../interfaces/Strago'

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type CommandInteraction, ComponentType, type MessageActionRowComponentBuilder, SlashCommandBuilder } from 'discord.js'

import { type Command } from '../interfaces/Command'
import * as xivlib from '../modules/xivlib'

const SERVER_NAMES = [
  'Adamantoise',
  'Aegis',
  'Alexander',
  'Alpha',
  'Anima',
  'Asura',
  'Atomos',
  'Bahamut',
  'Balmung',
  'Behemoth',
  'Belias',
  'Bismarck',
  'Brynhildr',
  'Cactuar',
  'Carbuncle',
  'Cerberus',
  'Chocobo',
  'Coeurl',
  'Diabolos',
  'Durandal',
  'Excalibur',
  'Exodus',
  'Faerie',
  'Famfrit',
  'Fenrir',
  'Garuda',
  'Gilgamesh',
  'Goblin',
  'Gungnir',
  'Hades',
  'Hyperion',
  'Ifrit',
  'Ixion',
  'Jenova',
  'Kujata',
  'Lamia',
  'Leviathan',
  'Lich',
  'Louisoix',
  'Malboro',
  'Mandragora',
  'Masamune',
  'Mateus',
  'Midgardsormr',
  'Moogle',
  'Odin',
  'Omega',
  'Pandaemonium',
  'Phantom',
  'Phoenix',
  'Ragnarok',
  'Raiden',
  'Ramuh',
  'Ravana',
  'Ridill',
  'Sagittarius',
  'Sargatanas',
  'Sephirot',
  'Shinryu',
  'Shiva',
  'Siren',
  'Sophia',
  'Spriggan',
  'Tiamat',
  'Titan',
  'Tonberry',
  'Twintania',
  'Typhon',
  'Ultima',
  'Ultros',
  'Unicorn',
  'Valefor',
  'Yojimbo',
  'Zalera',
  'Zeromus',
  'Zodiark',
  'Zurvan'
]

/**
 * Converts a string to title case.
 * @param str the input string
 * @returns title cased version of str
 */
const titleCase = (str: string): string => {
  return str.toLowerCase().split(' ')
    .filter(s => s)
    .map(word => {
      return word.replace(word[0], word[0].toUpperCase())
    })
    .join(' ')
}

/**
 * Runs the character registration workflow.
 */
export const register: Command = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register a character with Strago for achievement scanning.')
    .addStringOption(option =>
      option.setName('character')
        .setDescription('Your character\'s name.'))
    .addStringOption(option =>
      option.setName('server')
        .setDescription('The server (e.g. Balmung) on which your character resides.')
        .setAutocomplete(true))
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Your character\'s Lodestone ID. Use this if name search fails.')),
  run: async (interaction: CommandInteraction, strago: Strago): Promise<void> => {
    try {
      // This line is needed to access interaction options.
      if (!interaction.isChatInputCommand() || interaction.channel === null) return

      await interaction.reply({ content: 'Searching for character...', ephemeral: true })

      // Either characterId needs to be set, or character and server need to be set. Populate the other variables accordingly.
      let characterId = interaction.options.getString('id', false)
      let character = interaction.options.getString('character', false)
      let server = interaction.options.getString('server', false)
      if (characterId === null && character !== null && server !== null) {
        character = titleCase(character)
        server = titleCase(server)
        characterId = await xivlib.getCharacterId(character, server)
      } else if (characterId !== null) {
        [character, server] = await xivlib.getCharacterInfo(characterId)
      }
      if (characterId === null || characterId === '-1' || character === null || server === null) {
        await interaction.editReply({ content: 'I was unable to locate that character.' })
        return
      }

      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('verify')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Primary))

      const challenge = xivlib.generateChallenge(character, server)

      const message = await interaction.editReply({
        content: [`I found this character: <${xivlib.getUrl([characterId])}>`,
          'Please update your character profile to include this challenge: ',
                          `\`\`\`${challenge}\`\`\``,
                          'Once finished, please click the Verify button to begin verification.']
          .join('\n'),
        components: [row]
      })

      message.awaitMessageComponent({ filter: i => i.customId === 'verify', componentType: ComponentType.Button })
        .then(async i => {
          if (characterId != null && await xivlib.verifyCharacter(characterId)) {
            strago.logger.info(`Successfully registered ${characterId}`)
            await interaction.editReply({ content: 'You have successfully registered your character!', components: [] })
            const characters = strago.db.collection('characters')
            await characters.findOneAndReplace(
              { discordId: i.user.id },
              { discordId: i.user.id, characterId, characterName: character },
              { upsert: true })
          } else {
            if (characterId != null) {
              strago.logger.info(`Registration failed for ${characterId}`)
            } else {
              strago.logger.info('Missing character ID.')
            }
            await interaction.editReply({ content: 'I could not verify the challenge on your Lodestone profile.', components: [] })
          }
        })
        .catch(err => strago.logger.error(err))
    } catch (error) {
      strago.logger.error(error)
    }
  },
  autocomplete: (strago: Strago, prefix: string): string[] => {
    return SERVER_NAMES.filter(s => s.toLowerCase().startsWith(prefix.toLowerCase()))
  },
  guildCommand: true
}
