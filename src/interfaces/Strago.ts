import { Client, Collection } from "discord.js";
import { Sequelize } from "sequelize";

import { Command } from "./Command";

export interface Strago extends Client {
    commands: Collection<string, Command>;
    config: {
        id: string,
        testGuildId: string,
        token: string
    };
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
    db: Sequelize;
};