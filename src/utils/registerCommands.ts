import { REST } from "@discordjs/rest";
import { RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";

import { Strago } from "../interfaces/Strago";

/**
 * Attempts to register all Commands in the commands folder.
 * @param strago Strago client instance
 * @returns Whether or not the commands were successfully registered.
 */
export const registerCommands = async (strago: Strago): Promise<boolean> => {
    try {
        const rest = new REST({ version: "10" }).setToken(strago.config.token);

        const commandData: (
            | RESTPostAPIApplicationCommandsJSONBody
            | RESTPostAPIChatInputApplicationCommandsJSONBody
        )[] = [];

        strago.commands.forEach((command) => {
            const data = command.data.toJSON() as RESTPostAPIApplicationCommandsJSONBody;

            commandData.push(data);
        });

        if (process.env.NODE_ENV === "prod") {
            console.debug("Registering commands globally.");
            await rest.put(Routes.applicationCommands(strago.config.id), {
                body: commandData
            });
        } else {
            console.debug("Registering commands to test guild.");
            await rest.put(Routes.applicationGuildCommands(strago.config.id, strago.config.testGuildId), {
                body: commandData
            });
        }

        return true;
    } catch (error) {
        console.error("Failed to register commands:", error);
        return false;
    }
};