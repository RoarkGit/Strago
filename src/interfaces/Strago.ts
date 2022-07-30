import { Client, Collection } from "discord.js";
import { Sequelize } from "sequelize";

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
        id: string,
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
    /**
     * Database connection.
     */
    db: Sequelize;
};