import { Strago } from "./interfaces/Strago";

import { Client, GatewayIntentBits } from "discord.js";
import { join } from "path";

import achievementData from "./data/achievementData.json";
import { handleEvents } from "./events/handleEvents";
import { connectDatabase } from "./database/connectDatabase";
import { validateEnv } from "./modules/validateEnv";
import { loadCommands } from "./utils/loadCommands";
import { registerCommands } from "./utils/registerCommands";
import { initLogger } from "./utils/initLogger";

/**
 * Main entry point for Strago.
 */
(async () => {
    const strago = new Client({intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMembers }) as Strago;

    // Validate and load environment variables.
    const validatedEnvironment = validateEnv(strago);
    if (!validatedEnvironment.valid) {
        console.error(validatedEnvironment.message);
        return;
    }

    // Initialize logger.
    initLogger(strago);

    // Connect to the database.
    if (!connectDatabase(strago)) {
        strago.logger.error("Failed to conenct to database.");
        return;
    }

    // Load achievement/role data.
    strago.data = {
        achievementData: achievementData
    };

    // Load commands.
    const commandsPath = strago.config.env === "prod" ?
        join(process.cwd(), "prod", "commands") :
        join(process.cwd(), "src", "commands");
    if (!await loadCommands(strago, commandsPath)) {
        strago.logger.error("Failed to load commands");
        return;
    }

    // Register commands.
    strago.logger.info("Registering commands.");
    if (!await registerCommands(strago)) {
        strago.logger.error("Failed to register commands.");
        return;
    }

    // Load event handlers.
    handleEvents(strago);

    await strago.login(strago.config.token);
})();