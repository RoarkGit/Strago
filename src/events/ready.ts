import { Strago } from "../interfaces/Strago";

/**
 * Prints message when bot is connected and ready.
 * @param strago Strago client instance
 */
export const ready = async (strago: Strago) => {
    console.log("Discord ready!");
};