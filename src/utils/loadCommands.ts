import { Strago } from "../interfaces/Strago";

import { Collection } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";

import { Command } from "../interfaces/Command";

/**
 * Attempts to load all Commands stored in the commands folder.
 * @returns A Collection of name:Command pairs.
 */
export const loadCommands = async (strago: Strago, commandsPath: string): Promise<boolean> => {
    try {
        const commands: Collection<string, Command> = new Collection<string, Command>();
        const files = await readdir(commandsPath);

        for (const file of files) {
            const name = file.split(".")[0];
            const module = await import(
                join(commandsPath, file)
            );
            commands.set(name, module[name] as Command);
        }

        strago.commands = commands;
        return true;
    } catch (error) {
        strago.logger.error(error);
        return false;
    }
}