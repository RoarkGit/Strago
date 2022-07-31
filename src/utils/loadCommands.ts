import { Collection } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";

import { Command } from "../interfaces/Command";

/**
 * Attempts to load all Commands stored in the commands folder.
 * @returns A Collection of name:Command pairs.
 */
export const loadCommands = async (commandsPath: string): Promise<Collection<string, Command>> => {
    try {
        const result: Collection<string, Command> = new Collection<string, Command>();
        const files = await readdir(commandsPath);
        console.log(process.cwd());

        for (const file of files) {
            const name = file.split(".")[0];
            const module = await import(
                join(process.cwd(), "prod", "commands", file)
            );
            result.set(name, module[name] as Command);
        }

        return result;
    } catch (error) {
        console.error(error);
        return new Collection<string, Command>();
    }
}