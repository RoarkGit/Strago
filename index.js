const { token } = require('./config-prod.json');

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const { Sequelize, DataTypes } = require('sequelize');

process.on('uncaughtException', (error) => {
    console.error(error.stack);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load character and achievement data
client.db = new Sequelize({
    dialect: 'sqlite',
    storage: './data/storage.db'
});

client.characters = client.db.define('Character', {
    discordId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    characterId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    characterName: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

client.characters.sync();

client.achievementData = require('./data/achievements.json');

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(token);