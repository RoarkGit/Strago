import { Client, Collection, GatewayIntentBits } from "discord.js";

import { handleEvents } from "./events/handleEvents";
import { Strago } from "./interfaces/Strago";

import { join } from "path";
import achievementData from "./data/achievementData.json";
import { connectDatabase } from "./database/connectDatabase";
import { validateEnv } from "./modules/validateEnv";
import { loadCommands } from "./utils/loadCommands";
import { registerCommands } from "./utils/registerCommands";

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
    const commands = await loadCommands();
    strago.commands = commands;

    if (process.env.NODE_ENV !== "prod") {
        console.debug("Registering commands.");
        const success = await registerCommands(strago);
        if (!success) {
            console.error("Failed to register commands.");
            return;
        }
    }

    // Load event handlers.
    handleEvents(strago);

    await strago.login(strago.config.token);
})();