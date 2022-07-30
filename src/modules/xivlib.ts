import axios from "axios";
import crypto from "crypto";
import path from "path";
import  { PromisePool } from "@supercharge/promise-pool";
import * as nodestone from "@xivapi/nodestone";

const parsers = {
    character: new nodestone.Character(),
    characterSearch: new nodestone.CharacterSearch()
};

const ACHIEVEMENT_COMPLETE = 'entry__achievement__view--complete';
const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone/character/';

export const generateChallenge = (character: string, server: string): string => {
    const charString = (character + server).toLowerCase();
    const hash = crypto.createHash('sha1');
    hash.update(charString);
    return hash.digest('base64')
};

export const getCharacterId = async (character: string, server: string): Promise<string> => {
    const res: any = await parsers.characterSearch.parse({ query: { name: character, server: server }} as any);
    const charInfo = res.List[0];
    if (charInfo) {
        return charInfo.ID.toString();
    } else {
        return "-1";
    }
};

export const getAchievementsComplete = async (characterId: string, achievementIds: string[]): Promise<Set<string>> => {
    console.log(characterId, achievementIds);
    const achievementSet = new Set<string>();
    const { errors } = await PromisePool
        .for(achievementIds)
        .withConcurrency(10)
        .process(async (achievementId) => {
            if (await getAchievementComplete(characterId, achievementId)) {
                achievementSet.add(achievementId);
            };
        });
    errors.forEach(error => console);
    return achievementSet;
};

export const getAchievementComplete = async (characterId: string, achievementId: string): Promise<boolean> => {
    const url = getUrl([characterId, 'achievement', 'detail', achievementId]);
    return axios.get(url)
                .then(response => response.data.includes(ACHIEVEMENT_COMPLETE))
                .catch(error => false);
};

export const getAchievementsPublic = async (characterId: string): Promise<boolean> => {
    const url = getUrl([characterId, 'achievement']);
    return axios.get(url)
                .then(() => true)
                .catch(error => {
                    if (error.response.status != 403) {
                        console.log(error);
                    }
                    return false;
                });
};

export const verifyCharacter = async (characterId: string): Promise<boolean> => {
    const res: any = await parsers.character.parse({ params: { characterId: characterId } } as any);
    const character = res.Name;
    const server = res.World;
    const challenge = generateChallenge(character, server);
    return res.Bio.includes(challenge);
};

export const getUrl = (parts: string[]): string => {
    const urlPath = path.join.apply(null, parts);
    return new URL(urlPath, LODESTONE_URL).href;
};