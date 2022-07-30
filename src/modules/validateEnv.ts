import { Strago } from "../interfaces/Strago";

export const validateEnv = (strago: Strago): { valid: boolean, message: string } => {
    try {
        if (!process.env.BOT_TOKEN) {
            return { valid: false, message: "Missing bot token." };
        }

        if (!process.env.CLIENT_ID) {
            return { valid: false, message: "Missing client ID." };
        }

        if (!process.env.TEST_GUILD_ID) {
            return { valid: false, message: "Missing test guild ID." };
        }

        strago.config = {
            id: process.env.CLIENT_ID,
            testGuildId: process.env.TEST_GUILD_ID,
            token: process.env.BOT_TOKEN
        }

        return { valid: true, message: "Environment validated." };
    } catch (error) {
        console.error(error);
        return { valid: false, message: "Uncaught error when validating environment." };
    }
};