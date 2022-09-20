import { Strago } from "../interfaces/Strago"

import { interactionCreate } from "./interactionCreate";
import { ready } from "./ready";

/**
 * Loads event handlers for Strago.
 * @param strago Strago client instance
 */
export const handleEvents = (strago: Strago) => {
    strago.on("ready", async () => {
        await ready(strago);
    });

    strago.on("interactionCreate", async (interaction) => {
        await interactionCreate(interaction, strago);
    });
    
    process.on("uncaughtException", (error) => {
        strago.logger.error(error);
    });
};