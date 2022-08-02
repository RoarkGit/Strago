import { Strago } from "./interfaces/Strago";

import { Client, GatewayIntentBits } from "discord.js";
import { join } from "path";

import achievementData from "./data/achievementData.json";
import { handleEvents } from "./events/handleEvents";
import { connectDatabase } from "./database/connectDatabase";
import { validateEnv } from "./modules/validateEnv";
import { loadCommands } from "./utils/loadCommands";
import { registerCommands } from "./utils/registerCommands";

/**
 * Main entry point for Strago.
 */
(async () => {
    const strago = new Client({intents: GatewayIntentBits.Guilds }) as Strago;

    // Validate and load environment variables.
    const validatedEnvironment = validateEnv(strago);
    if (!validatedEnvironment.valid) {
        console.error(validatedEnvironment.message);
        return;
    }

    // Connect to the database.
    if (!connectDatabase(strago)) return;

    // Load achievement/role data.
    strago.data = {
        achievementData: achievementData
    };

    // Load commands.
    const commandsPath = strago.config.env === "prod" ?
        join(process.cwd(), "prod", "commands") :
        join(process.cwd(), "src", "commands");
    const commands = await loadCommands(commandsPath);
    strago.commands = commands;

    // Register commands.
    console.debug("Registering commands.");
    const success = await registerCommands(strago);
    if (!success) {
        console.error("Failed to register commands.");
        return;
    }

    // Load event handlers.
    handleEvents(strago);

    await strago.login(strago.config.token);
})();