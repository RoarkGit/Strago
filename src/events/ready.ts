import { Strago } from "../interfaces/Strago";

export const ready = async (strago: Strago): Promise<void> => {
    console.log("Discord ready!");
};