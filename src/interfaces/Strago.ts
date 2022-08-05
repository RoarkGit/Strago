import { Client, Collection } from "discord.js";
import { Logger } from "winston";

import { Command } from "./Command";

/**
 * Implementation of Discord client.
 */
export interface Strago extends Client {
    /**
     * Collection of Commands stored as name:Command pairs.
     */
    commands: Collection<string, Command>;
    /**
     * Various config values.
     */
    config: {
        databaseUri: string,
        env: string,
        id: string,
        loggerUri: string | undefined;
        testGuildId: string,
        token: string
    };
    /**
     * Static data.
     */
    data: {
        achievementData: {
            achievementIds: {
                [key: string]: string
            },
            roles: {
                    name: string;
                    required: string[];
                    blockedBy: string[];
            }[]
        }
    };
    logger: Logger;
};