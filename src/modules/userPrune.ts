import { Strago } from "../interfaces/Strago";

/**
 * Prunes all users who have not verified and joined more than ten minutes ago.
 */
export const userPrune = async (strago: Strago) => {
    const guilds = strago.guilds.cache;
    const now = Date.now();
    guilds.forEach(async (g) => {
        const tenMinutesMs = 1000 * 60 * 10;
        const members = await g.members.fetch();
        const toPrune = members.filter(m => m.roles.cache.every(r => r.name !== "Verified") && (now - m.joinedTimestamp! > tenMinutesMs));
        toPrune.forEach(m => {
            strago.logger.info(`Removing unverified user: ${m.user.username}`);
            m.kick("Verification time exceeded ten minutes.");
        });
    });
};