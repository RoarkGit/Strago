import { Strago } from "../interfaces/Strago";

import { userPrune } from "../modules/userPrune";

/**
 * Prints message when bot is connected and ready.
 * @param strago Strago client instance
 */
export const ready = async (strago: Strago) => {
    strago.logger.info("Discord ready!");
    setInterval(userPrune, 1000 * 60);
};