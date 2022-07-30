import { Strago } from "../interfaces/Strago";

import { readdir } from "fs/promises";
import { join } from "path";
import { DataTypes, Sequelize } from "sequelize";

export const connectDatabase = async (strago: Strago): Promise<boolean> => {
    try {
        strago.db = new Sequelize({
            dialect: "sqlite",
            storage: join(process.cwd(), "data", "storage.db")
        });

        const files = await readdir(
            join(process.cwd(), "prod", "database", "models")
        );

        for (const file of files) {
            const name = file.split(".")[0];
            const model = await import(
                join(process.cwd(), "prod", "database", "models", file)
            )
            strago.db.define(name, model[name]);
        }

        strago.db.sync();

        return true;
    } catch(error) {
        console.error("Failed to conenct to database:", error);
        return false;
    }
};