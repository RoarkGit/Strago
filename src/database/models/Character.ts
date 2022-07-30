import { DataTypes } from "sequelize";

export const Character = {
    discordId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    characterId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    characterName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
};