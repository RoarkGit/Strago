import { Strago } from "../interfaces/Strago"

import { interactionCreate } from "./interactionCreate";
import { ready } from "./ready";

export const handleEvents = (strago: Strago): void => {
    strago.on("ready", async () => {
        await ready(strago);
    });

    strago.on("interactionCreate", async (interaction) => {
        await interactionCreate(interaction, strago);
    });
};